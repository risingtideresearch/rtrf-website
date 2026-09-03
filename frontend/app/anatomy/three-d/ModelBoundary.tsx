"use client";
import { Component, ReactNode } from "react";

type Props = { url: string; onFailure: () => void; children: ReactNode };

/**
 * Drops a single model that fails to load rather than losing the whole scene.
 * Suspense only catches promises, so a 404 from useGLTF throws through it.
 *
 * A failure still counts as loaded, otherwise the camera waits forever for a
 * model that is never coming and never frames the ones that did arrive.
 */
export class ModelBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`Could not load ${this.props.url}, skipping it.`, error);
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
