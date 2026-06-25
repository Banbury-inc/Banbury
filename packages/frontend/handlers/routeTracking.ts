import type { NextRouter } from 'next/router'
import { ApiService } from 'backend/api/apiService'

export function attachRouteTracking(router: NextRouter) {
  if (!router || typeof window === 'undefined') return

  const handleRoute = (url: string) => {
    try {
      const { hash } = window.location
      const fullPath = `${url}${hash || ''}`
      
      // Determine page title and content type based on route
      const { pageTitle, contentType } = getPageMetadata(url)
      
      ApiService.Tracking.trackPageView(fullPath, {
        pageTitle,
        contentType
      })
    } catch {
      /* ignore tracking errors */
    }
  }

  // Track initial load
  handleRoute(router.asPath)

  // Track on route changes
  router.events.on('routeChangeComplete', handleRoute)

  // Return a cleanup function for callers that need to detach
  return () => {
    router.events.off('routeChangeComplete', handleRoute)
  }
}

function getPageMetadata(url: string): { pageTitle: string; contentType: string } {
  // Remove query parameters and hash for route matching
  const cleanPath = url.split('?')[0].split('#')[0]
  
  // Define page metadata based on routes
  const routeMetadata: Record<string, { pageTitle: string; contentType: string }> = {
    '/': { 
      pageTitle: 'Banbury - AI-Powered Workflow Engine', 
      contentType: 'landing_page' 
    },
    '/dashboard': { 
      pageTitle: 'Dashboard - Banbury', 
      contentType: 'dashboard' 
    },
    '/features': { 
      pageTitle: 'Features - Banbury', 
      contentType: 'features_page' 
    },
    '/pricing': { 
      pageTitle: 'Pricing - Banbury', 
      contentType: 'pricing_page' 
    },
    '/login': { 
      pageTitle: 'Login - Banbury', 
      contentType: 'auth_page' 
    },
    '/register': { 
      pageTitle: 'Register - Banbury', 
      contentType: 'auth_page' 
    },
    '/workspaces': { 
      pageTitle: 'Workspaces - Banbury', 
      contentType: 'workspaces_page' 
    },
    '/task-studio': { 
      pageTitle: 'Task Studio - Banbury', 
      contentType: 'task_studio' 
    },
    '/meeting-agent': { 
      pageTitle: 'Meeting Agent - Banbury', 
      contentType: 'meeting_agent' 
    },
    '/knowledge': { 
      pageTitle: 'Knowledge Base - Banbury', 
      contentType: 'knowledge_page' 
    },
    '/docs': { 
      pageTitle: 'Docs - What is Banbury?', 
      contentType: 'documentation - what is banbury' 
    },
    '/api-docs': { 
      pageTitle: 'API Documentation - Banbury', 
      contentType: 'api_documentation' 
    },
    '/settings': { 
      pageTitle: 'Settings - Banbury', 
      contentType: 'settings_page' 
    },
    '/admin': { 
      pageTitle: 'Admin - Banbury', 
      contentType: 'admin_page' 
    },
    '/privacy_policy': { 
      pageTitle: 'Privacy Policy - Banbury', 
      contentType: 'legal_page' 
    },
    '/terms_of_use': { 
      pageTitle: 'Terms of Use - Banbury', 
      contentType: 'legal_page' 
    }
  }
  
  // Check for exact match first
  if (routeMetadata[cleanPath]) {
    return routeMetadata[cleanPath]
  }
  
  // Check for dynamic routes
  if (cleanPath.startsWith('/docs/')) {
    const section = cleanPath.replace('/docs/', '')
    const { pageTitle, contentType } = getDocsPageMetadata(section)
    return { pageTitle, contentType }
  }
  
  if (cleanPath.startsWith('/news/')) {
    return { 
      pageTitle: 'News Article - Banbury', 
      contentType: 'news_article' 
    }
  }
  
  if (cleanPath.startsWith('/auth/')) {
    return { 
      pageTitle: 'Authentication - Banbury', 
      contentType: 'auth_page' 
    }
  }
  
  if (cleanPath.startsWith('/filedownload/')) {
    return { 
      pageTitle: 'File Download - Banbury', 
      contentType: 'file_download' 
    }
  }
  
  // Default fallback
  return { 
    pageTitle: `${cleanPath} - Banbury`, 
    contentType: 'unknown_page' 
  }
}

function getDocsPageMetadata(section: string): { pageTitle: string; contentType: string } {
  const titleMap: Record<string, string> = {
    'what-is-banbury': 'Docs - What is Banbury?',
    'using-banbury': 'Docs - Using Banbury',
    'desktop-app': 'Docs - Desktop App',
    'features': 'Docs - Features Overview',
    'agent-modes': 'Docs - Agent Modes',
    'parallel-agents': 'Docs - Parallel Agents',
    'queued-messages': 'Docs - Queued Messages',
    'video-generation': 'Docs - Video Generation',
    'gmail-feature': 'Docs - Gmail Feature',
    'docs-feature': 'Docs - Docs Feature',
    'spreadsheets-feature': 'Docs - Spreadsheets Feature',
    'powerpoint-feature': 'Docs - PowerPoint Feature',
    'context-wheel': 'Docs - Context Wheel',
    'calendar-feature': 'Docs - Calendar Feature',
    'meeting-agent-feature': 'Docs - Meeting Agent Feature',
    'folders-feature': 'Docs - Folders Feature',
    'browse-feature': 'Docs - Browse Feature',
    'maps-feature': 'Docs - Maps Feature',
    'canvas-feature': 'Docs - Canvas Feature',
    'file-sharing': 'Docs - File Sharing',
    'databases': 'Docs - Databases',
    'knowledge-graph': 'Docs - Knowledge Graph',
    'memories': 'Docs - Memories',
    'task-studio': 'Docs - Task Studio',
    'flows': 'Docs - Flows',
    'integrations': 'Docs - Integrations Overview',
    'gmail': 'Docs - Gmail Integration',
    'google-docs': 'Docs - Google Docs Integration',
    'google-sheets': 'Docs - Google Sheets Integration',
    'outlook': 'Docs - Outlook Integration',
    'x': 'Docs - X (Twitter) Integration',
    'microsoft-calendar': 'Docs - Microsoft Calendar Integration',
    'microsoft-teams': 'Docs - Microsoft Teams Integration',
    'onedrive': 'Docs - OneDrive Integration',
    'dropbox': 'Docs - Dropbox Integration',
    'notion': 'Docs - Notion Integration',
    'billing': 'Docs - Billing'
  }

  const contentTypeMap: Record<string, string> = {
    'what-is-banbury': 'documentation - what is banbury',
    'using-banbury': 'documentation - using banbury',
    'desktop-app': 'documentation - desktop app',
    'features': 'documentation - features overview',
    'agent-modes': 'documentation - agent modes',
    'parallel-agents': 'documentation - parallel agents',
    'queued-messages': 'documentation - queued messages',
    'video-generation': 'documentation - video generation',
    'gmail-feature': 'documentation - gmail feature',
    'docs-feature': 'documentation - docs feature',
    'spreadsheets-feature': 'documentation - spreadsheets feature',
    'powerpoint-feature': 'documentation - powerpoint feature',
    'context-wheel': 'documentation - context wheel',
    'calendar-feature': 'documentation - calendar feature',
    'meeting-agent-feature': 'documentation - meeting agent',
    'folders-feature': 'documentation - folders feature',
    'browse-feature': 'documentation - browse feature',
    'maps-feature': 'documentation - maps feature',
    'canvas-feature': 'documentation - canvas feature',
    'file-sharing': 'documentation - file sharing',
    'databases': 'documentation - databases',
    'knowledge-graph': 'documentation - knowledge graph',
    'memories': 'documentation - memories',
    'task-studio': 'documentation - task studio',
    'flows': 'documentation - flows',
    'integrations': 'documentation - integrations overview',
    'gmail': 'documentation - gmail integration',
    'google-docs': 'documentation - google docs integration',
    'google-sheets': 'documentation - google sheets integration',
    'outlook': 'documentation - outlook integration',
    'x': 'documentation - x integration',
    'microsoft-calendar': 'documentation - microsoft calendar integration',
    'microsoft-teams': 'documentation - microsoft teams integration',
    'onedrive': 'documentation - onedrive integration',
    'dropbox': 'documentation - dropbox integration',
    'notion': 'documentation - notion integration',
    'billing': 'documentation - billing'
  }

  return {
    pageTitle: titleMap[section] || `Docs - ${section}`,
    contentType: contentTypeMap[section] || `documentation - ${section}`
  }
}


