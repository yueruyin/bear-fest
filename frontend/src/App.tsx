import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireAdminAuth } from './admin/RequireAdminAuth'
import {
  AboutPage,
  AdminLayout,
  AdminLoginPage,
  AdminSiteConfigPage,
  AdminLeadsPage,
  AdminMerchantSignupsPage,
  AdminCasesPage,
  CaseDetailPage,
  CasesPage,
  ContactPage,
  HomePage,
  MerchantSignupPage,
  ServicesPage,
} from './pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route path="site-config" element={<AdminSiteConfigPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="merchant-signups" element={<AdminMerchantSignupsPage />} />
          <Route path="cases" element={<AdminCasesPage />} />
        </Route>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:slug" element={<CaseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/merchant-signup" element={<MerchantSignupPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
