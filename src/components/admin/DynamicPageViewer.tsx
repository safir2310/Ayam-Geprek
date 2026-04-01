'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DynamicFeature {
  id: string
  name: string
  title: string
  type: string
  content: string
  order: number
  isVisible: boolean
}

interface DynamicPage {
  id: string
  name: string
  title: string
  description?: string
  layout: string
  features: DynamicFeature[]
}

interface DynamicPageViewerProps {
  page: DynamicPage
}

export default function DynamicPageViewer({ page }: DynamicPageViewerProps) {
  const [featureContents, setFeatureContents] = useState<Record<string, any>>({})

  useEffect(() => {
    const contents: Record<string, any> = {}
    page.features.forEach((feature) => {
      try {
        contents[feature.id] = JSON.parse(feature.content)
      } catch {
        contents[feature.id] = {}
      }
    })
    // Using a stable approach to update state
    const updateContents = () => {
      setFeatureContents(contents)
    }
    updateContents()
  }, [page.features])

  const renderFeature = (feature: DynamicFeature) => {
    const content = featureContents[feature.id] || {}

    switch (feature.type) {
      case 'CARD':
        return (
          <Card className="border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content.value && (
                <p className="text-2xl font-bold text-orange-600">{content.value}</p>
              )}
              {content.description && (
                <p className="text-xs text-muted-foreground mt-1">{content.description}</p>
              )}
            </CardContent>
          </Card>
        )

      case 'STAT':
        return (
          <Card className="border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {content.value && (
                    <p className="text-2xl font-bold text-orange-600">{content.value}</p>
                  )}
                  {content.change && (
                    <p
                      className={`text-xs mt-1 ${
                        content.change.includes('+') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {content.change}
                    </p>
                  )}
                </div>
                {content.icon && (
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-2xl">{content.icon}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'TABLE':
        return (
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.headers && content.rows ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {content.headers.map((header: string, idx: number) => (
                          <th key={idx} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.rows.map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="border-b last:border-0">
                          {content.headers.map((header: string, colIdx: number) => (
                            <td key={colIdx} className="p-2">
                              {row[header] || row[colIdx] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Konfigurasi tabel tidak lengkap
                </p>
              )}
            </CardContent>
          </Card>
        )

      case 'LIST':
        return (
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.items && Array.isArray(content.items) ? (
                <ul className="space-y-2">
                  {content.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>{item.label || item.name || item}</span>
                      {item.count && <Badge variant="outline">{item.count}</Badge>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Konfigurasi list tidak lengkap
                </p>
              )}
            </CardContent>
          </Card>
        )

      case 'TEXT':
        return (
          <Card className="border-orange-100">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                {content.text && <p>{content.text}</p>}
                {content.html && (
                  <div dangerouslySetInnerHTML={{ __html: content.html }} />
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'BUTTON':
        return (
          <button
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              content.variant === 'primary'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                : content.variant === 'secondary'
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50'
            }`}
            onClick={() => {
              if (content.action) {
                console.log('Button action:', content.action)
              }
            }}
          >
            {feature.title}
          </button>
        )

      case 'DIVIDER':
        return <div className="border-t border-gray-200 my-4" />

      case 'IMAGE':
        return (
          <Card className="border-orange-100 overflow-hidden">
            <CardContent className="p-0">
              {content.src ? (
                <img
                  src={content.src}
                  alt={feature.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-orange-50 flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              {content.caption && (
                <p className="text-sm text-center py-2 px-4 text-muted-foreground">
                  {content.caption}
                </p>
              )}
            </CardContent>
          </Card>
        )

      case 'CHART':
        return (
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground bg-orange-50 rounded-lg">
                <div className="text-center space-y-2">
                  <span className="text-4xl">📊</span>
                  <p className="text-sm">Chart Placeholder</p>
                  <p className="text-xs">Gunakan library chart untuk visualisasi data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'FORM':
        return (
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.fields && Array.isArray(content.fields) ? (
                <div className="space-y-4">
                  {content.fields.map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <label className="text-sm font-medium">{field.label}</label>
                      {field.type === 'select' ? (
                        <select className="w-full p-2 border rounded-lg">
                          {field.options?.map((opt: string, optIdx: number) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="w-full p-2 border rounded-lg"
                          rows={3}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          className="w-full p-2 border rounded-lg"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                  <button className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    {content.submitText || 'Submit'}
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Konfigurasi form tidak lengkap
                </p>
              )}
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="border-orange-100">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                Unknown feature type: {feature.type}
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  const getLayoutClassName = () => {
    switch (page.layout) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      case 'list':
        return 'flex flex-col gap-4'
      case 'card':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4'
      case 'table':
        return 'flex flex-col gap-4'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    }
  }

  const visibleFeatures = page.features.filter((f) => f.isVisible).sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-orange-600">{page.title}</h2>
        {page.description && <p className="text-muted-foreground mt-1">{page.description}</p>}
      </div>

      {/* Features */}
      {visibleFeatures.length === 0 ? (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Belum ada fitur ditambahkan ke halaman ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className={getLayoutClassName()}>
          {visibleFeatures.map((feature) => (
            <div key={feature.id}>{renderFeature(feature)}</div>
          ))}
        </div>
      )}
    </div>
  )
}
