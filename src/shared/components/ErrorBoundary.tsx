import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { crashReporting } from '@/services/crashReporting';
import { logger } from '@/services/logging';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    crashReporting.captureError(error, { componentStack: errorInfo.componentStack ?? '' });
    logger.error('general', 'ErrorBoundary caught error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 justify-center items-center p-6 bg-background-primary">
          <Text className="text-text-primary text-body-lg font-semibold mb-2">
            Something went wrong
          </Text>
          <Text className="text-text-secondary text-body-sm text-center mb-3">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </Text>
          <View className="max-h-48 w-full mb-6">
            <Text
              selectable
              className="text-text-tertiary text-caption text-left"
            >
              {this.state.error?.stack ?? 'No stack available.'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-brand-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-brand-onPrimary font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
