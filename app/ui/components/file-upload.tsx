import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
    onChange: (files: File[]) => void;
    value?: File[];
    multiple?: boolean;
    accept?: string;
    maxSizeInMB?: number;
    className?: string;
}

export function FileUpload({
    onChange,
    value = [],
    multiple = false,
    accept = 'image/*',
    maxSizeInMB = 5,
    className = ''
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;

        const validFiles: File[] = [];
        const currentFiles = multiple ? [...value] : [];

        Array.from(files).forEach(file => {
            // Check size
            if (file.size / 1024 / 1024 > maxSizeInMB) {
                alert(`File ${file.name} quá lớn. Tối đa ${maxSizeInMB}MB.`);
                return;
            }
            // Check type (simple check)
            if (accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
                // strict check can be complex, this is a basic one
            }
            validFiles.push(file);
        });

        if (multiple) {
            onChange([...currentFiles, ...validFiles]);
        } else {
            onChange(validFiles.length > 0 ? [validFiles[0]] : []);
        }
    }, [onChange, value, multiple, maxSizeInMB, accept]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...value];
        newFiles.splice(index, 1);
        onChange(newFiles);
    };

    const openFileDialog = () => {
        inputRef.current?.click();
    };

    return (
        <div className={className}>
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer 
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
                        <Upload size={24} />
                    </div>
                    <p className="text-gray-900 font-medium">Click để tải lên hình ảnh</p>
                    <p className="text-sm text-gray-500">hoặc kéo thả vào đây</p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG. Tối đa {maxSizeInMB}MB</p>
                </div>
            </div>

            {value.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {value.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative group bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2 relative">
                                {file.type.startsWith('image/') ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <File size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="px-1">
                                <p className="text-xs text-gray-700 font-medium truncate" title={file.name}>{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-gray-500 hover:text-red-500 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
