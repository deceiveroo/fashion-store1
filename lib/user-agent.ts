const UAParser = require('ua-parser-js');

export interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
  icon: 'mobile' | 'tablet' | 'desktop';
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent || userAgent === 'Unknown') {
    return {
      device: 'Неизвестное устройство',
      os: 'Unknown',
      browser: 'Unknown',
      icon: 'desktop',
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determine device type
  let icon: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let deviceType = 'Компьютер';

  if (result.device.type === 'mobile' || (!result.device.type && /Mobile|Android|iPhone/i.test(userAgent))) {
    icon = 'mobile';
    deviceType = 'Мобильный телефон';
  } else if (result.device.type === 'tablet' || /Tablet|iPad/i.test(userAgent)) {
    icon = 'tablet';
    deviceType = 'Планшет';
  }

  // Get OS
  const os = result.os.name 
    ? `${result.os.name} ${result.os.version || ''}`.trim()
    : 'Unknown OS';

  // Get browser
  const browser = result.browser.name
    ? `${result.browser.name} ${result.browser.version?.split('.')[0] || ''}`.trim()
    : 'Unknown Browser';

  // Format device string
  const device = `${deviceType} • ${browser} • ${os}`;

  return {
    device,
    os,
    browser,
    icon,
  };
}
