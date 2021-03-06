﻿using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Core.Configuration;
using Umbraco.Core.IO;


namespace Umbraco.Core.Media
{
    /// <summary>
    /// A helper class used for imaging
    /// </summary>
    internal static class ImageHelper
    {
        public static string GetMimeType(this Image image)
        {
            var format = image.RawFormat;
            var codec = ImageCodecInfo.GetImageDecoders().First(c => c.FormatID == format.Guid);
            return codec.MimeType;
        }

        internal static IEnumerable<ResizedImage> GenerateMediaThumbnails(
            IFileSystem fs, 
            string fileName, 
            string extension, 
            Image originalImage,
            IEnumerable<int> additionalThumbSizes)
        {
            // Make default thumbnails
            var thumbs = new List<ResizedImage>
                {
                    Resize(fs, fileName, extension, 100, "thumb", originalImage), 
                    Resize(fs, fileName, extension, 500, "big-thumb", originalImage)
                };

            //make custom ones
            foreach (var thumb in additionalThumbSizes.Where(x => x > 0).Distinct())
            {
                thumbs.Add(Resize(fs, fileName, extension, thumb, string.Format("thumb_{0}", thumb), originalImage));
            }

            return thumbs;
        }

        private static ResizedImage Resize(IFileSystem fileSystem, string path, string extension, int maxWidthHeight, string fileNameAddition, Image originalImage)
        {
            var fileNameThumb = String.IsNullOrEmpty(fileNameAddition)
                                            ? string.Format("{0}_UMBRACOSYSTHUMBNAIL.jpg", path.Substring(0, path.LastIndexOf(".")))
                                            : string.Format("{0}_{1}.jpg", path.Substring(0, path.LastIndexOf(".")), fileNameAddition);

            var thumb = GenerateThumbnail(
                originalImage,
                maxWidthHeight,
                fileNameThumb,
                extension,
                fileSystem);

            return thumb;
        }

        internal static ResizedImage GenerateThumbnail(Image image, int maxWidthHeight, string thumbnailFileName, string extension, IFileSystem fs)
        {
            return GenerateThumbnail(image, maxWidthHeight, -1, -1, thumbnailFileName, extension, fs);
        }

        internal static ResizedImage GenerateThumbnail(Image image, int fixedWidth, int fixedHeight, string thumbnailFileName, string extension, IFileSystem fs)
        {
            return GenerateThumbnail(image, -1, fixedWidth, fixedHeight, thumbnailFileName, extension, fs);
        }

        private static ResizedImage GenerateThumbnail(Image image, int maxWidthHeight, int fixedWidth, int fixedHeight, string thumbnailFileName, string extension, IFileSystem fs)
        {
            // Generate thumbnail
            float f = 1;
            if (maxWidthHeight >= 0)
            {
                var fx = (float)image.Size.Width / maxWidthHeight;
                var fy = (float)image.Size.Height / maxWidthHeight;

                // must fit in thumbnail size
                f = Math.Max(fx, fy);
            }

            //depending on if we are doing fixed width resizing or not.
            fixedWidth = (maxWidthHeight > 0) ? image.Width : fixedWidth;
            fixedHeight = (maxWidthHeight > 0) ? image.Height : fixedHeight;

            var widthTh = (int)Math.Round(fixedWidth / f);
            var heightTh = (int)Math.Round(fixedHeight / f);

            // fixes for empty width or height
            if (widthTh == 0)
                widthTh = 1;
            if (heightTh == 0)
                heightTh = 1;

            // Create new image with best quality settings
            using (var bp = new Bitmap(widthTh, heightTh))
            {
                using (var g = Graphics.FromImage(bp))
                {
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.CompositingQuality = CompositingQuality.HighQuality;

                    // Copy the old image to the new and resized
                    var rect = new Rectangle(0, 0, widthTh, heightTh);
                    g.DrawImage(image, rect, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel);

                    // Copy metadata
                    var imageEncoders = ImageCodecInfo.GetImageEncoders();

                    var codec = extension.ToLower() == "png" || extension.ToLower() == "gif"
                        ? imageEncoders.Single(t => t.MimeType.Equals("image/png"))
                        : imageEncoders.Single(t => t.MimeType.Equals("image/jpeg"));

                    // Set compresion ratio to 90%
                    var ep = new EncoderParameters();
                    ep.Param[0] = new EncoderParameter(Encoder.Quality, 90L);

                    // Save the new image using the dimensions of the image
                    var newFileName = thumbnailFileName.Replace("UMBRACOSYSTHUMBNAIL", string.Format("{0}x{1}", widthTh, heightTh));
                    using (var ms = new MemoryStream())
                    {
                        bp.Save(ms, codec, ep);
                        ms.Seek(0, 0);

                        fs.AddFile(newFileName, ms);
                    }

                    return new ResizedImage(widthTh, heightTh, newFileName);
                }
            }
        }

    }
}
