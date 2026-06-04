import { Suspense, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from '@shared/components/layout/Layout';
import { ErrorBoundary } from '@shared/components/layout/ErrorBoundary';
import { CourseLanding } from '@shared/components/CourseLanding';
import { beforeSendFilter, useAnalytics } from '@shared/hooks/useAnalytics';
import { ALL_SECTIONS } from '@shared/constants/curriculum';
import { SECTION_LOADERS } from './sectionRegistry';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-8 h-8 border-4 border-engineering-blue-200 dark:border-engineering-blue-800 border-t-engineering-blue-600 dark:border-t-engineering-blue-400 rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function Page({ Component }: { Component: ComponentType }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  useAnalytics();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <CourseLanding />
              </ErrorBoundary>
            }
          />
          {ALL_SECTIONS.map((section) => (
            <Route key={section.id} path={section.route} element={<Page Component={SECTION_LOADERS[section.id]} />} />
          ))}
        </Routes>
      </Layout>
      <Analytics beforeSend={beforeSendFilter} />
    </BrowserRouter>
  );
}
