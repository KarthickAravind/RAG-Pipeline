import { SearchFilters } from '@/types/api'

interface SideFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

export function SideFilters({ filters, onFiltersChange }: SideFiltersProps) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="card-compact">
      <div className="card-compact-header">
        <h3 className="card-compact-title">Filters</h3>
        <p className="text-xs text-muted-foreground">Refine your search results</p>
      </div>
      <div className="card-compact-content space-y-4">
        {/* Component Types - Hidden since real data doesn't have component types */}
        {false && (
          <div>
            <label className="block text-sm font-medium mb-2">Component Types</label>
            <div className="space-y-2">
              {['Groovy', 'WSDL', 'XSLT', 'BPMN', 'Properties', 'XML', 'Other'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.component_types?.includes(type) || false}
                    onChange={(e) => {
                      const current = filters.component_types || []
                      if (e.target.checked) {
                        updateFilter('component_types', [...current, type])
                      } else {
                        updateFilter('component_types', current.filter(t => t !== type))
                      }
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Additional filters can be added here */}
      </div>
    </div>
  )
}
