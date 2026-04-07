'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui/elements/Button'

export const KMLImport: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState('book')
  const [publishStatus, setPublishStatus] = useState('draft')
  const [statusMessage, setStatusMessage] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.kml')) {
        console.error('Please select a .kml file')
        setStatusMessage('Error: Please select a .kml file')
        return
      }
      setSelectedFile(file)
      setStatusMessage('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      console.error('Please select a KML file first')
      setStatusMessage('Error: Please select a KML file first')
      return
    }

    setIsUploading(true)
    setStatusMessage('Importing...')

    try {
      const formData = new FormData()
      formData.append('kmlFile', selectedFile)
      formData.append('category', category)
      formData.append('publishStatus', publishStatus)

      const response = await fetch('/api/kml-import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        console.log('Import successful:', result.message)
        setStatusMessage(`Success: ${result.message}`)
        setSelectedFile(null)
        // Reset file input
        const fileInput = document.getElementById('kml-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        console.error('Import failed:', result.error)
        setStatusMessage(`Error: ${result.error || 'Import failed'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setStatusMessage('Error: Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>KML Import</h2>
      <p>Import listings from a Google KML file (e.g., exported from Google Maps).</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          KML File:
        </label>
        <input
          id="kml-file"
          type="file"
          accept=".kml"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        {selectedFile && (
          <p style={{ fontSize: '14px', color: '#666' }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Category:
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '200px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="book">Book</option>
          <option value="food">Food</option>
          <option value="hygiene">Hygiene</option>
          <option value="community">Community</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Publish Status:
        </label>
        <select
          value={publishStatus}
          onChange={(e) => setPublishStatus(e.target.value)}
          style={{ width: '200px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="draft">Draft</option>
          <option value="live">Live</option>
        </select>
      </div>

      <Button onClick={handleUpload} disabled={isUploading || !selectedFile} buttonStyle="primary">
        {isUploading ? 'Importing...' : 'Import KML File'}
      </Button>

      {statusMessage && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: statusMessage.startsWith('Error')
              ? '#ffebee'
              : statusMessage.startsWith('Success')
                ? '#e8f5e8'
                : '#fff3e0',
            border: `1px solid ${statusMessage.startsWith('Error') ? '#f44336' : statusMessage.startsWith('Success') ? '#4caf50' : '#ff9800'}`,
            color: statusMessage.startsWith('Error')
              ? '#c62828'
              : statusMessage.startsWith('Success')
                ? '#2e7d32'
                : '#e65100',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h4>Supported Format:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Google KML files (.kml)</li>
          <li>Only placemarks with Point coordinates will be imported</li>
          <li>LineString and Polygon geometries are skipped</li>
        </ul>
      </div>
    </div>
  )
}
