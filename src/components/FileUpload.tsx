'use client';

import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onError,
  maxSizeMB = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid PDF or DOCX file';
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);
      setUploadProgress(100); // Simulate upload complete
      onFileSelect(file);
    },
    [onFileSelect, onError, maxSizeMB]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
  }, []);

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isDragging && 'border-primary bg-primary/5',
        className
      )}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="p-8"
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div
              className={cn(
                'rounded-full p-4 transition-colors',
                isDragging ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              <Upload className={cn('h-8 w-8', isDragging && 'text-primary')} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Upload Document Template</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your PDF or DOCX file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {maxSizeMB}MB
              </p>
            </div>

            <label htmlFor="file-input">
              <Button type="button" asChild>
                <span>Choose File</span>
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {uploadProgress === 100 && (
              <div className="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-600">
                File uploaded successfully
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
