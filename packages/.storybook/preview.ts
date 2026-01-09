import React from "react"
import type { Preview } from "@storybook/react"
import { ThemeProvider } from "../frontend/components/ThemeProvider"
import "../frontend/index.css"


const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      disable: true // Disable storybook backgrounds, use theme instead
    },
    layout: "fullscreen"
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "dark"
      
      // Create a wrapper component that uses hooks properly
      const ThemeWrapper = ({ story, themeValue }: { story: typeof Story; themeValue: string }) => {
        React.useEffect(() => {
          const root = document.documentElement
          const body = document.body
          
          if (themeValue === "dark") {
            root.classList.add("dark")
          } else {
            root.classList.remove("dark")
          }
          
          // Remove body styles for transparent background
          body.className = "text-foreground"
          body.style.backgroundColor = "transparent"
          
          // Add a style tag to override any CSS background rules
          let styleTag = document.getElementById("storybook-bg-override")
          if (!styleTag) {
            styleTag = document.createElement("style")
            styleTag.id = "storybook-bg-override"
            styleTag.innerHTML = `
              body, html, #storybook-root {
                background-color: transparent !important;
                background: transparent !important;
              }
            `
            document.head.appendChild(styleTag)
          }
        }, [themeValue])

        return React.createElement(
          ThemeProvider,
          {
            attribute: "class",
            defaultTheme: themeValue,
            enableSystem: false,
            storageKey: "storybook-theme-mode",
            forcedTheme: themeValue
          },
          React.createElement("div", { className: "text-foreground" }, React.createElement(story))
        )
      }

      return React.createElement(ThemeWrapper, { story: Story, themeValue: theme })
    }
  ]
}

export default preview


