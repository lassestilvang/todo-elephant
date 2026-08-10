"use client";

import React, { useEffect, useRef, cloneElement, ReactElement, Children } from "react";
import { X, AlertCircle, CheckCircle, Info, Warning } from "lucide-react";
import { useFocusTrap } from "@/src/lib/accessibility";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "success" | "warning" | "error" | "info";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  variant = "default",
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Trap focus when open
  useFocusTrap(modalRef);

  // Handle escape key press
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const variantClasses = {
    default: {
      border: "border-border",
      icon: Info,
      iconClass: "text-blue-500",
    },
    success: {
      border: "border-emerald-500/50",
      icon: CheckCircle,
      iconClass: "text-emerald-500",
    },
    warning: {
      border: "border-amber-500/50",
      icon: Warning,
      iconClass: "text-amber-500",
    },
    error: {
      border: "border-red-500/50",
      icon: AlertCircle,
      iconClass: "text-red-500",
    },
    info: {
      border: "border-blue-500/50",
      icon: Info,
      iconClass: "text-blue-500",
    },
  };

  const Icon = variantClasses[variant].icon;
  const iconClass = variantClasses[variant].iconClass;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      aria-labelledby="modal-title"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`bg-card rounded-2xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all duration-200 ease-out ${
          variantClasses[variant].border
        }`}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Icon className={iconClass} size={24} aria-hidden="true" />
            <h2 id="modal-title" className="text-lg font-bold text-foreground">
              {title}
            </h2>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground hover:bg-muted/10 rounded-lg p-1.5 transition-all"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Convenience component for confirmation dialogs
 */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on mount
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
    >
      <div onKeyDown={handleKeyDown}>
        <p className="text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:bg-muted/10 transition-all"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-accent text-white hover:bg-accent/90"
            }`}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}