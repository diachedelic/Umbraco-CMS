﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading;
using Umbraco.Core.Configuration.BaseRest;
using Umbraco.Core.Configuration.Dashboard;
using Umbraco.Core.Configuration.UmbracoSettings;
using Umbraco.Core.Logging;

namespace Umbraco.Core.Configuration
{
    /// <summary>
    /// The gateway to all umbraco configuration
    /// </summary>
    public class UmbracoConfig
    {
        #region Singleton

        private static readonly Lazy<UmbracoConfig> Lazy = new Lazy<UmbracoConfig>(() => new UmbracoConfig());

        public static UmbracoConfig For
        {
            get { return Lazy.Value; }            
        }

        #endregion

        /// <summary>
        /// Default constructor 
        /// </summary>
        private UmbracoConfig()
        {
            if (_umbracoSettings == null)
            {
                var umbracoSettings = ConfigurationManager.GetSection("umbracoConfiguration/settings") as IUmbracoSettingsSection;
                if (umbracoSettings == null)
                {
                    LogHelper.Warn<UmbracoConfig>("Could not load the " + typeof(IUmbracoSettingsSection) + " from config file!");
                }
                SetUmbracoSettings(umbracoSettings);
            }

            if (_baseRestExtensions == null)
            {
                var baseRestExtensions = ConfigurationManager.GetSection("umbracoConfiguration/BaseRestExtensions") as IBaseRestSection;
                if (baseRestExtensions == null)
                {
                    LogHelper.Warn<UmbracoConfig>("Could not load the " + typeof(IBaseRestSection) + " from config file!");
                }
                SetBaseRestExtensions(baseRestExtensions);
            }

            if (_dashboardSection == null)
            {
                var dashboardConfig = ConfigurationManager.GetSection("umbracoConfiguration/dashBoard") as IDashboardSection;
                if (dashboardConfig == null)
                {
                    LogHelper.Warn<UmbracoConfig>("Could not load the " + typeof(IDashboardSection) + " from config file!");
                }
                SetDashboardSettings(dashboardConfig);
            }
        }

        /// <summary>
        /// Constructor - can be used for testing
        /// </summary>
        /// <param name="umbracoSettings"></param>
        /// <param name="baseRestSettings"></param>
        /// <param name="dashboardSettings"></param>
        public UmbracoConfig(IUmbracoSettingsSection umbracoSettings, IBaseRestSection baseRestSettings, IDashboardSection dashboardSettings)
        {
            SetUmbracoSettings(umbracoSettings);
            SetBaseRestExtensions(baseRestSettings);
            SetDashboardSettings(dashboardSettings);
        }

        private IDashboardSection _dashboardSection;
        private IUmbracoSettingsSection _umbracoSettings;
        private IBaseRestSection _baseRestExtensions;

        /// <summary>
        /// Gets the IDashboardSection
        /// </summary>
        public IDashboardSection DashboardSettings()
        {
            return _dashboardSection;
        }        

        //ONLY for unit testing
        internal void SetDashboardSettings(IDashboardSection value)
        {
            _dashboardSection = value;
        }

        //ONLY for unit testing
        internal void SetUmbracoSettings(IUmbracoSettingsSection value)
        {
            _umbracoSettings = value;
        }

        /// <summary>
        /// Gets the IUmbracoSettings
        /// </summary>
        public IUmbracoSettingsSection UmbracoSettings()
        {
            return _umbracoSettings;
        }
        
        //ONLY for unit testing
        public void SetBaseRestExtensions(IBaseRestSection value)
        {
            _baseRestExtensions = value;
        }

        /// <summary>
        /// Gets the IBaseRestSection
        /// </summary>
        public IBaseRestSection BaseRestExtensions()
        {
            return _baseRestExtensions;
        }

        //TODO: Add other configurations here !
    }
}