'use client'

import { useState, useRef, useEffect } from 'react'
import { WhiteboardItem } from '@/types'
import { cn, generateId } from '@/lib/utils'
import { Code, FileText, BarChart, Image, X, Move, Maximize, Minimize } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DynamicWhiteboardProps {
  items: WhiteboardItem[]
  onItemsChange: (items: WhiteboardItem[]) => void
  className?: string
}

interface WhiteboardItemComponentProps {
  item: WhiteboardItem
  onUpdate: (item: WhiteboardItem) => void
  onDelete: (id: string) => void
  isSelected: boolean
  onSelect: (id: string) => void
}

function WhiteboardItemComponent({
  item,
  onUpdate,
  onDelete,
  isSelected,
  onSelect
}: WhiteboardItemComponentProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.item-header')) {
      setIsDragging(true)
      onSelect(item.id)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && itemRef.current) {
      const rect = itemRef.current.parentElement?.getBoundingClientRect()
      if (rect) {
        const newX = e.clientX - rect.left - item.size.width / 2
        const newY = e.clientY - rect.top - item.size.height / 2
        
        onUpdate({
          ...item,
          position: {
            x: Math.max(0, Math.min(newX, rect.width - item.size.width)),
            y: Math.max(0, Math.min(newY, rect.height - item.size.height))
          }
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, item.size.width, item.size.height])

  const getItemIcon = () => {
    switch (item.type) {
      case 'code': return <Code size={16} />
      case 'text': return <FileText size={16} />
      case 'chart': return <BarChart size={16} />
      case 'image': return <Image size={16} />
      default: return <FileText size={16} />
    }
  }

  const getItemColor = () => {
    switch (item.type) {
      case 'code': return 'border-blue-300 bg-blue-50'
      case 'text': return 'border-gray-300 bg-gray-50'
      case 'chart': return 'border-green-300 bg-green-50'
      case 'image': return 'border-purple-300 bg-purple-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const renderContent = () => {
    switch (item.type) {
      case 'code':
        return (
          <pre className="text-sm font-mono bg-gray-900 text-green-400 p-3 rounded overflow-auto">
            <code>{item.content}</code>
          </pre>
        )
      case 'text':
        return (
          <div className="p-3 text-sm leading-relaxed">
            {item.content}
          </div>
        )
      case 'chart':
        return (
          <div className="p-3 flex items-center justify-center bg-white rounded">
            <div className="text-center text-gray-500">
              <BarChart size={48} />
              <p className="mt-2 text-xs">Chart: {item.content}</p>
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="p-3 flex items-center justify-center bg-white rounded">
            <div className="text-center text-gray-500">
              <Image size={48} />
              <p className="mt-2 text-xs">Image: {item.content}</p>
            </div>
          </div>
        )
      default:
        return <div className="p-3">{item.content}</div>
    }
  }

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "absolute border-2 rounded-lg shadow-lg backdrop-blur-sm cursor-move select-none",
        getItemColor(),
        isSelected ? "ring-2 ring-blue-400 ring-opacity-50" : "",
        isDragging ? "cursor-grabbing z-50" : "cursor-grab"
      )}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(item.id)}
    >
      {/* Header */}
      <div className="item-header flex items-center justify-between p-2 border-b bg-white bg-opacity-70 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {getItemIcon()}
          <span className="text-xs font-medium capitalize">{item.type}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Toggle size
              const newSize = item.size.width === 300 ? { width: 200, height: 150 } : { width: 300, height: 200 }
              onUpdate({ ...item, size: newSize })
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {item.size.width === 300 ? <Minimize size={12} /> : <Maximize size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item.id)
            }}
            className="p-1 hover:bg-red-200 rounded text-red-600"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 cursor-se-resize"
        onMouseDown={(e) => {
          e.stopPropagation()
          setIsResizing(true)
        }}
      />
    </motion.div>
  )
}

export function DynamicWhiteboard({ items, onItemsChange, className = "" }: DynamicWhiteboardProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const whiteboardRef = useRef<HTMLDivElement>(null)

  const addItem = (type: WhiteboardItem['type'], content: string) => {
    const newItem: WhiteboardItem = {
      id: generateId(),
      type,
      content,
      position: { 
        x: Math.random() * 200, 
        y: Math.random() * 200 
      },
      size: { width: 250, height: 180 }
    }
    onItemsChange([...items, newItem])
  }

  const updateItem = (updatedItem: WhiteboardItem) => {
    onItemsChange(items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
  }

  const deleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id))
    if (selectedItem === id) {
      setSelectedItem(null)
    }
  }

  const handleWhiteboardClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null)
    }
  }

  // Auto-add items based on context (this would be triggered by AI)
  const autoAddCodeExample = (code: string) => {
    addItem('code', code)
  }

  const autoAddExplanation = (text: string) => {
    addItem('text', text)
  }

  const autoAddChart = (chartData: string) => {
    addItem('chart', chartData)
  }

  // Expose functions for AI integration
  useEffect(() => {
    const win = window as { 
      whiteboardAddCode?: (code: string) => void;
      whiteboardAddText?: (text: string) => void;
      whiteboardAddChart?: (chart: string) => void;
    }
    win.whiteboardAddCode = autoAddCodeExample;
    win.whiteboardAddText = autoAddExplanation;
    win.whiteboardAddChart = autoAddChart;
  }, [autoAddCodeExample, autoAddExplanation, autoAddChart])

  return (
    <div className={cn("relative w-full h-full min-h-[500px]", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <button
          onClick={() => addItem('code', '# Python code example\nprint("Hello, World!")')}
          className="p-2 hover:bg-blue-100 rounded-md transition-colors"
          title="Add Code Block"
        >
          <Code size={20} className="text-blue-600" />
        </button>
        <button
          onClick={() => addItem('text', 'This is an explanation or note...')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Add Text"
        >
          <FileText size={20} className="text-gray-600" />
        </button>
        <button
          onClick={() => addItem('chart', 'Sample Chart Data')}
          className="p-2 hover:bg-green-100 rounded-md transition-colors"
          title="Add Chart"
        >
          <BarChart size={20} className="text-green-600" />
        </button>
        <button
          onClick={() => addItem('image', 'Sample Image Placeholder')}
          className="p-2 hover:bg-purple-100 rounded-md transition-colors"
          title="Add Image"
        >
          <Image size={20} className="text-purple-600" />
        </button>
      </div>

      {/* Whiteboard Canvas */}
      <div
        ref={whiteboardRef}
        className="w-full h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden"
        onClick={handleWhiteboardClick}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Items */}
        <AnimatePresence>
          {items.map(item => (
            <WhiteboardItemComponent
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
              isSelected={selectedItem === item.id}
              onSelect={setSelectedItem}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Move size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">Dynamic Whiteboard</p>
              <p className="text-sm">Add code, text, charts, and images to visualize your learning</p>
            </div>
          </div>
        )}
      </div>

      {/* Item count */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-gray-600">
        {items.length} items
      </div>
    </div>
  )
}