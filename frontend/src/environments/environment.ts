import { appSettings } from '../app/core/config/app-settings';

export const environment = {
  production: false,
  appName: appSettings.appName,
  apiBaseUrl: appSettings.apiBaseUrl,
};
