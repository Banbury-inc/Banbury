import type { NextRouter } from 'next/router'
import { trackPageView } from '@/services/trackingService'

export function attachRouteTracking(router: NextRouter) {
  if (!router || typeof window === 'undefined') return

  const handleRoute = (url: string) => {
    try {
      const { hash } = window.location
      const fullPath = `${url}${hash || ''}`
      
      // Determine page title and content type based on route
      const { pageTitle, contentType } = getPageMetadata(url)
      
      trackPageView(fullPath, {
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
    'features': 'Docs - Features Overview',
    'gmail-feature': 'Docs - Gmail Feature',
    'docs-feature': 'Docs - Docs Feature',
    'spreadsheets-feature': 'Docs - Spreadsheets Feature',
    'calendar-feature': 'Docs - Calendar Feature',
    'meeting-agent-feature': 'Docs - Meeting Agent Feature',
    'folders-feature': 'Docs - Folders Feature',
    'browse-feature': 'Docs - Browse Feature',
    'canvas-feature': 'Docs - Canvas Feature',
    'knowledge-graph': 'Docs - Knowledge Graph',
    'memories': 'Docs - Memories',
    'task-studio': 'Docs - Task Studio',
    'integrations': 'Docs - Integrations Overview',
    'gmail': 'Docs - Gmail Integration',
    'google-docs': 'Docs - Google Docs Integration',
    'google-sheets': 'Docs - Google Sheets Integration',
    'outlook': 'Docs - Outlook Integration',
    'x': 'Docs - X (Twitter) Integration'
  }

  const contentTypeMap: Record<string, string> = {
    'what-is-banbury': 'documentation - what is banbury',
    'using-banbury': 'documentation - using banbury',
    'features': 'documentation - features overview',
    'gmail-feature': 'documentation - gmail feature',
    'docs-feature': 'documentation - docs feature',
    'spreadsheets-feature': 'documentation - spreadsheets feature',
    'calendar-feature': 'documentation - calendar feature',
    'meeting-agent-feature': 'documentation - meeting agent',
    'folders-feature': 'documentation - folders feature',
    'browse-feature': 'documentation - browse feature',
    'canvas-feature': 'documentation - canvas feature',
    'knowledge-graph': 'documentation - knowledge graph',
    'memories': 'documentation - memories',
    'task-studio': 'documentation - task studio',
    'integrations': 'documentation - integrations overview',
    'gmail': 'documentation - gmail integration',
    'google-docs': 'documentation - google docs integration',
    'google-sheets': 'documentation - google sheets integration',
    'outlook': 'documentation - outlook integration',
    'x': 'documentation - x integration'
  }

  return {
    pageTitle: titleMap[section] || `Docs - ${section}`,
    contentType: contentTypeMap[section] || `documentation - ${section}`
  }
}


