"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Dimension {
    id: string
    name: string
    description: string
}

interface DimensionSelectorProps {
    dimensions: Dimension[]
    selectedDimensions: string[]
    onSelectionChange: (selected: string[]) => void
}

export function DimensionSelector({ dimensions, selectedDimensions, onSelectionChange }: DimensionSelectorProps) {
    const handleDimensionToggle = (dimensionId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedDimensions, dimensionId])
        } else {
            onSelectionChange(selectedDimensions.filter((id) => id !== dimensionId))
        }
    }

    const selectAll = () => {
        onSelectionChange(dimensions.map((d) => d.id))
    }

    const clearAll = () => {
        onSelectionChange([])
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Select Evaluation Dimensions</CardTitle>
                    <div className="flex gap-2">
                        <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-800">
                            Select All
                        </button>
                        <span className="text-gray-400">|</span>
                        <button onClick={clearAll} className="text-sm text-gray-600 hover:text-gray-800">
                            Clear All
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dimensions.map((dimension) => (
                        <div key={dimension.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <Checkbox
                                id={dimension.id}
                                checked={selectedDimensions.includes(dimension.id)}
                                onCheckedChange={(checked) => handleDimensionToggle(dimension.id, checked as boolean)}
                            />
                            <div className="flex-1">
                                <Label htmlFor={dimension.id} className="font-medium cursor-pointer">
                                    {dimension.id}: {dimension.name}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">{dimension.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    Selected: {selectedDimensions.length} of {dimensions.length} dimensions
                </div>
            </CardContent>
        </Card>
    )
}
