'use client'

import { useEffect } from 'react'

/**
 * Global Error Handler Component
 * 
 * Suppresses known wallet extension errors that are not critical
 * and would otherwise spam the console.
 * 
 * This component should be placed at the root level (in layout.tsx)
 * to catch all errors globally.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Suppress wallet extension JSON parse errors globally
    const originalErrorHandler = window.onerror
    const originalUnhandledRejection = window.onunhandledrejection
    
    // Handle synchronous errors
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = message?.toString() || ''
      const sourceStr = source?.toString() || ''
      
      // Suppress wallet extension JSON parse errors
      if (
        (errorMessage.includes('Unexpected token') && errorMessage.includes('setImmedia')) ||
        (errorMessage.includes('is not valid JSON') && sourceStr.includes('inpage.js')) ||
        (sourceStr.includes('chrome-extension://') && errorMessage.includes('JSON')) ||
        (sourceStr.includes('chrome-extension://') && errorMessage.includes('setImmedia'))
      ) {
        // This is a known wallet extension issue, not critical
        // Suppress to prevent error spamming
        return true // Prevent default error handling
      }
      
      // Call original handler for other errors
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error)
      }
      return false
    }
    
    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const error = event.reason
      const errorMessage = error?.message?.toString() || error?.toString() || ''
      const stack = error?.stack?.toString() || ''
      
      // Suppress wallet extension JSON parse errors
      if (
        (errorMessage.includes('Unexpected token') && errorMessage.includes('setImmedia')) ||
        (errorMessage.includes('is not valid JSON') && stack.includes('inpage.js')) ||
        (stack.includes('chrome-extension://') && errorMessage.includes('JSON')) ||
        (stack.includes('chrome-extension://') && errorMessage.includes('setImmedia'))
      ) {
        // This is a known wallet extension issue, not critical
        event.preventDefault() // Prevent default error handling
        return
      }
      
      // Call original handler for other errors
      if (originalUnhandledRejection) {
        return originalUnhandledRejection.call(window, event)
      }
    }
    
    // Also suppress console errors from wallet extension
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || ''
      const stack = args[1]?.stack?.toString() || args.join(' ') || ''
      
      // Suppress wallet extension JSON parse errors
      if (
        (errorMessage.includes('Unexpected token') && errorMessage.includes('setImmedia')) ||
        (errorMessage.includes('is not valid JSON') && (stack.includes('inpage.js') || stack.includes('chrome-extension://'))) ||
        (stack.includes('chrome-extension://') && errorMessage.includes('JSON')) ||
        (stack.includes('chrome-extension://') && errorMessage.includes('setImmedia'))
      ) {
        // This is a known wallet extension issue, not critical
        // Suppress to prevent error spamming
        return
      }
      
      // Log other errors normally
      originalConsoleError.apply(console, args)
    }
    
    return () => {
      // Restore original handlers
      window.onerror = originalErrorHandler
      window.onunhandledrejection = originalUnhandledRejection
      console.error = originalConsoleError
    }
  }, [])
  
  return null
}
