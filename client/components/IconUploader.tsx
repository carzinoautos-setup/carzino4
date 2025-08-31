import React, { useState, useRef } from "react";
import { Upload, X, Check } from "lucide-react";

interface IconUploaderProps {
  onIconUpload: (iconUrl: string) => void;
  currentIcon?: string;
  label?: string;
}

export const IconUploader: React.FC<IconUploaderProps> = ({
  onIconUpload,
  currentIcon,
  label = "Upload Icon",
}) => {
  const [preview, setPreview] = useState<string | null>(currentIcon || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onIconUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearIcon = () => {
    setPreview(null);
    onIconUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Icon preview"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Upload className="w-3 h-3 mr-1" />
                Change
              </button>
              <button
                onClick={clearIcon}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3 mr-1" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, SVG up to 2MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {preview && (
        <div className="mt-2 flex items-center text-xs text-green-600">
          <Check className="w-3 h-3 mr-1" />
          Icon uploaded successfully
        </div>
      )}
    </div>
  );
};
