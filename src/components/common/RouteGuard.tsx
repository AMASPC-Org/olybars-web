
import React from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface RouteGuardProps {
  children: React.ReactNode;
  /**
   * The query key segment to check in the cache.
   * e.g., if checking for a venue, we might check ['venues', id]
   * For now, we'll keep it simple and just do a basic ID check,
   * but this scaffold allows for deeper cache inspection later.
   */
  entityType?: 'venue' | 'user';
}

/**
 * RouteGuard (The Bouncer)
 * 
 * Intercepts navigation to dynamic routes (like /venues/:id).
 * If the ID is clearly invalid or missing from our potential dataset,
 * it redirects to the 404 page instead of letting the app crash.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ children, entityType = 'venue' }) => {
  const params = useParams<{ id: string }>();
  // const queryClient = useQueryClient(); // Future: Check cache
  const location = useLocation();

  // Basic Sanity Check: a missing ID param in a route that expects one
  if (!params.id || params.id === 'undefined' || params.id === 'null') {
    console.warn(`[RouteGuard] Blocking invalid navigation to ${location.pathname}`);
    return <Navigate to="/404" replace />;
  }

  // Future Logic: 
  // if (entityType === 'venue') {
  //    const state = queryClient.getQueryState(['venue', params.id]);
  //    if (state?.status === 'error') return <Navigate to="/404" />
  // }

  return <>{children}</>;
};
