interface ToggleFiltersHandlerParams {
  hotTableRef: React.RefObject<any>
}

export function createToggleFiltersHandler({
  hotTableRef
}: ToggleFiltersHandlerParams) {
  const handleToggleFilters = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const filters = hotInstance.getPlugin('filters')
      if (filters) {
        if (filters.isEnabled()) {
          filters.disablePlugin()
        } else {
          filters.enablePlugin()
        }
        hotInstance.render()
      }
    }
  }

  return {
    handleToggleFilters
  }
}
