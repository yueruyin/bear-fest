import { BrowserRouter, Route, Routes } from 'react-router-dom'
import {
  AboutPage,
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
