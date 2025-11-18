import axios from 'axios';

export const determineOS = async (setDownloadText: any, setDownloadUrl: any) => {
  try {
    const response = await axios.get('https://api.github.com/repos/Banbury-inc/banbury-cloud-frontend/releases/latest');
    const latestRelease = response.data;
    const assets = latestRelease.assets;

    const userAgent = navigator.userAgent;
    let downloadAsset;

    if (userAgent.includes("Win")) {
      downloadAsset = assets.find((asset: { name: string }) => asset.name.includes('.exe'));
      setDownloadText("Download for Windows");
    } else if (userAgent.includes("Mac")) {
      downloadAsset = assets.find((asset: { name: string }) => asset.name.includes('.dmg'));
      setDownloadText("Download for macOS");
    } else if (userAgent.includes("Linux")) {
      downloadAsset = assets.find((asset: { name: string }) => asset.name.includes('.deb'));
      setDownloadText("Download for Linux");
    } else {
      setDownloadText("Download");
      setDownloadUrl("/path_to_generic_file"); // Generic file if OS is not detected
      return;
    }

    if (downloadAsset) {
      setDownloadUrl(downloadAsset.browser_download_url);
    } else {
      setDownloadUrl("/path_to_generic_file"); // Fallback if no specific asset is found
    }
  } catch (error) {
    console.error("Error fetching latest release:", error);
    setDownloadText("Download");
    setDownloadUrl("/path_to_generic_file"); // Fallback in case of error
  }
};



