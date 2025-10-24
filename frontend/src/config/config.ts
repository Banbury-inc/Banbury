export const CONFIG = {
  relayHost: '32.27.118.149',
  relayPort: 443,
  full_device_sync: false,
  skip_dot_files: true,
  scan_selected_folders: true,
  run_device_info_loop: false,
  run_device_predictions_loop: false,
  prod: false,
  dev: false,
  semi_local: false,
  get url() {
    //return this.prod ? 'https://banbury-cloud-backend-prod-389236221119.us-east1.run.app/' : 'http://localhost:8080/';
    if (this.prod) {
      return 'http://api.dev.banbury.io';
    } else if (this.dev) {
      // return 'http://54.197.4.251:8080';
      //return 'http://3.84.158.138:8080';
      return 'https://www.api.dev.banbury.io';
    } else if (this.semi_local) {
      return 'http://10.123.1.90:8080/';
    } else {
      return 'http://localhost:8080';
    }
  },
  get url_ws() {
    //return this.prod ? 'https://banbury-cloud-backend-prod-389236221119.us-east1.run.app/' : 'http://localhost:8080/';
    if (this.prod) {
      return 'ws://api.dev.banbury.io/ws/live_data/';
    } else if (this.dev) {
      // return 'http://54.197.4.251:8080';
      // return 'ws://3.84.158.138:8082/ws/live_data/';
      return 'ws://www.api.dev.banbury.io/ws/live_data/';
    }
    else if (this.semi_local) {
      return 'ws://10.123.1.90:8082/ws/live_data/';
    } else {
      return 'ws://0.0.0.0:8082/ws/live_data/';
    }
  }
  ,
  // JupyterLab base URL for embedded notebooks (optional)
  get jupyterUrl() {
    // Prefer environment variable when available
    const env = (typeof window !== 'undefined' ? (window as any).env : undefined)
    const fromEnv = (typeof process !== 'undefined' && (process as any).env && (process as any).env.NEXT_PUBLIC_JUPYTER_URL)
      || (env && env.NEXT_PUBLIC_JUPYTER_URL)
    if (fromEnv) return String(fromEnv)
    // Default to empty to disable embedding when not configured
    return ''
  }
}
