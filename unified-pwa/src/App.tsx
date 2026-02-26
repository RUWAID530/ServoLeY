// Last updated: 2024-01-24T12:00:00.000Z
import { useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
// import { apiServiceWithFallback } from './services/api'
// import { Link } from 'react-router-dom'
import Landing from './pages/Landing'
import RoleSelector from './pages/RoleSelector'
import ModernLogin from './pages/ModernLogin'
import ModernCustomerSignup from './pages/ModernCustomerSignup'
import ForgotPassword from './pages/ForgotPassword'
import LandingView from './pages/LandingView'
import Unauthorized from './pages/Unauthorized'

// Customer Pages
import CustomerChat from './pages/CustomerChat'
import Reviews from './pages/CustomerReviews'
import CustomerAvailabilityCheck from './pages/CustomerAvailabilityCheck'
import CustomerProfile from './pages/CustomerProfile'
import CustomerProviderDetails from './pages/Customerproviderdetails'
import CustomerNotification from './pages/CustomerNotification'
import CustomerBookingsDashboard from './pages/CustomerBookingsDashboard'
import CustomerSupportTicket from './pages/CustomerSupportTicket'
import CustomerUpcomingBookings from './pages/CustomerUpcomingBookings'
import CustomerSettingsDashboard from './pages/CustomerSettingsDashboard'
import { CustomerSupportDashboard } from './pages/CustomerSupportDashboard'
import { CustomerWallet } from './pages/CustomerWallet'
import CustomerServicesDashboard from './pages/CustomerServicesDashboard'

// Provider Pages
import { ProviderDashboard } from './pages/ProviderDashboard'
import ProviderProfile from './pages/ProviderProfile'
import ProviderSettings from './pages/ProviderSettings'
import ProviderChat from './pages/ProviderChat'
import ProviderOrders from './pages/ProviderOrders'
import ProviderReviews from './pages/ProviderReviews'
import ProviderCalendar from './pages/ProviderCalendar'
import ProviderAvailability from './pages/ProviderAvailability'
import ProviderNotification from './pages/ProviderNotifications'
import ProviderCustomers from './pages/ProviderCustomers'
import { ServicesView as ProviderService } from './pages/ProviderService'
import ProviderWallet from './pages/ProviderWallet'
import PostRequirement from './pages/PostRequirementPage'
import ProviderRegistration from './pages/ProviderRegistration'
import ProviderVerificationPending from './pages/ProviderVerificationPending'
import ProviderSignup from './pages/ProviderSignup'
import NewListing from './pages/NewListing'
import AdminPanel from './admin/AdminPanel'
import AdminLogin from './pages/AdminLogin'
import VendorVerification from './pages/VendorVerification'
import AdminServiceVerification from './pages/AdminServiceVerification'
import { ProfilePage as Profile } from './pages/Profile'
import EscrowIntegration from './pages/EscrowIntegration'

// Layouts
import ProviderLayout from './layouts/ProviderLayout'

// Components
import RoleBasedRoute from './components/RoleBasedRoute'
import { ProviderProfileProvider } from './contexts/ProviderProfileContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { sanitizeRedirectPath } from './utils/redirectAllowlist'

// Use environment variable for API base URL to support Project IDX
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8086'
export type Page = 'landing' | 'login' | 'signup' | 'customer-signup' | 'customer' | 'provider' | 'provider-signup' | 'role' | 'customer-dashboard' | 'provider-dashboard';



function App() {
  const navigate = useNavigate();
  const navigateProviderView = (view: string) => {
    const targetView = view === 'overview' ? 'dashboard' : view;
    navigate(sanitizeRedirectPath(`/provider/${targetView}`, '/provider/dashboard'));
  };

  useEffect(() => {
    document.body.style.backgroundColor = "#0f172a";
  }, []);
  return (
    <ThemeProvider>
      <ProviderProfileProvider>
          <div className="min-h-screen bg-slate-900">
          <Routes>
      
        {/* Default route redirects to landing page */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/landing" element={<Landing onNavigate={(page: Page) => {
            if (page === 'login') navigate('/auth');
            else if (page === 'signup') navigate('/role');
            else if (page === 'role') navigate('/role');
            else if (page === 'provider-signup') navigate('/providersignup');
            else if (page === 'customer-dashboard') navigate('/customer/home');
            else if (page === 'provider-dashboard') navigate('/provider/dashboard');
          }} />} />
        
        
       
        
     


          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/role" element={<RoleSelector onNavigate={(page: string) => navigate('/' + page)} />} />
          <Route path="/customersignup" element={<ModernCustomerSignup />} />
          <Route path="/signup-fixed" element={<ModernCustomerSignup />} />
          <Route path="/customer/signup-modern" element={<ModernCustomerSignup />} />
          <Route path="/providersignup" element={<ProviderSignup />} />
          <Route path="/provider/verification-pending" element={<ProviderVerificationPending />} />

        
  

          <Route path="/login-signup" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<ModernLogin />} />
          <Route path="/customer-dashboard" element={<Navigate to="/customer/home" replace />} />
          <Route path="/provider-dashboard" element={<Navigate to="/provider/dashboard" replace />} />
          <Route path="/unified" element={<Navigate to="/provider/dashboard" replace />} />

          <Route path="/customer/home" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
    <LandingView 
      onStartService={(categoryId: string) => navigate(`/customer/check-availability?category=${encodeURIComponent(categoryId)}`)}
    />
  </RoleBasedRoute>
} />

          <Route path="/Landing/View" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
    <LandingView 
      onStartService={(categoryId: string) => navigate(`/customer/check-availability?category=${encodeURIComponent(categoryId)}`)}
    />
  </RoleBasedRoute>
} />


      
          <Route path="/customer/profile" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerProfile />
        </RoleBasedRoute>
      } />

      <Route path="/provider-signup" element={<Navigate to="/providersignup" replace />} />

          <Route path="/customer/reviews" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <Reviews />
        </RoleBasedRoute>
      } />
          <Route path="/customer/notifications" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerNotification />
        </RoleBasedRoute>
      } />

      <Route path="/auth" element={<ModernLogin />} />


      
          <Route path="/customer/bookings" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
      <CustomerBookingsDashboard 
        onBack={() => window.history.back()}
        onComplete={() => window.history.back()}
      />
  </RoleBasedRoute>
} />



      
    



          <Route path="/customer/support/ticket" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerSupportTicket />
        </RoleBasedRoute>
      } />

          <Route path="/customer/upcoming-bookings" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerUpcomingBookings />
      </RoleBasedRoute>
      } />

      

          <Route path="/customer/setting" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerSettingsDashboard />
        </RoleBasedRoute>
      } />


          <Route path="/customer/support/dashboard" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
    <CustomerSupportDashboard onOpenChat={() => window.location.href = '/customer/chat'} />
  </RoleBasedRoute>
} />


          <Route path="/customer/services" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
    <CustomerServicesDashboard />
  </RoleBasedRoute>
} />




          <Route path="/customer/chat" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerChat />
        </RoleBasedRoute>
      } />

      

          <Route path="/customer/wallet" element={
  <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
    <CustomerWallet />
  </RoleBasedRoute>
} />




      

      
     
          <Route path="/customer/post-requirement" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <PostRequirement />
        </RoleBasedRoute>
      } />

          <Route path="/customer/provider-details" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerProviderDetails />
        </RoleBasedRoute>
      } />

          <Route path="/customer/check-availability" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerAvailabilityCheck />
        </RoleBasedRoute>
      } />

          <Route path="/customer/availability-check/:providerId/:serviceName" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerAvailabilityCheck />
        </RoleBasedRoute>
      } />

          {/* Provider Routes */}

          <Route path="/provider/overview" element={<Navigate to="/provider/dashboard" replace />} />

          <Route path="/provider/dashboard" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="overview" setView={navigateProviderView}>
      <ProviderDashboard onNavigate={(path: string) => {
        // Navigate directly to provider routes since we're using layouts
        const fullPath = path.startsWith('/') ? path : `/provider/${path}`;
        navigate(sanitizeRedirectPath(fullPath, '/provider/dashboard'));
      }} />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/calendar" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="calendar" setView={navigateProviderView}>
      <ProviderCalendar />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/settings" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="settings" setView={navigateProviderView}>
      <ProviderSettings />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/bookings" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="bookings" setView={navigateProviderView}>
      <ProviderOrders />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/services" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="services" setView={navigateProviderView}>
      <ProviderService />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/new-listing" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="services" setView={navigateProviderView}>
      <NewListing />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/customers" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="customers" setView={navigateProviderView}>
      <ProviderCustomers />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/messages" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="messages" setView={navigateProviderView}>
      <ProviderChat />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/payouts" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="payouts" setView={navigateProviderView}>
      <ProviderWallet />
    </ProviderLayout>
  </RoleBasedRoute>
} />

          <Route path="/provider/payout" element={
  <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
    <ProviderLayout showSidebar={true} showHeader={true} currentView="payouts" setView={navigateProviderView}>
      <ProviderWallet />
    </ProviderLayout>
  </RoleBasedRoute>
} />

    
          <Route path="/provider/service" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderService />
        </RoleBasedRoute>
      } />

          <Route path="/provider/chat" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderChat />
        </RoleBasedRoute>
      } />

          <Route path="/provider/wallet" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderWallet />
        </RoleBasedRoute>
      } />

          <Route path="/provider/orders" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderLayout showSidebar={true} showHeader={true} currentView="bookings" setView={navigateProviderView}>
            <ProviderOrders />
          </ProviderLayout>
        </RoleBasedRoute>
      } />

          <Route path="/provider/notification" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderNotification />
        </RoleBasedRoute>  
      } />

          <Route path="/provider/reviews" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderLayout showSidebar={true} showHeader={true} currentView="reviews" setView={navigateProviderView}>
            <ProviderReviews />
          </ProviderLayout>
        </RoleBasedRoute>
      } />

          <Route path="/provider/profile" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderProfile />
        </RoleBasedRoute>
      } />

          <Route path="/provider/availability" element={
        <RoleBasedRoute allowedRoles={["PROVIDER", "provider"]}>
          <ProviderAvailability />
        </RoleBasedRoute>
      } />
      
          {/* Private routes for all authenticated users */}
   
      
          <Route path="/customer/chat/:orderId" element={
        <RoleBasedRoute allowedRoles={["CUSTOMER", "customer"]}>
          <CustomerChat/>
        </RoleBasedRoute>
      } />
      
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
        <RoleBasedRoute allowedRoles={["ADMIN", "admin"]}>
          <AdminPanel />
        </RoleBasedRoute>
      } />
          <Route path="/admin/service-verification" element={<AdminServiceVerification />} />

          {/* Vendor Routes */}
          <Route path="/vendor/verification" element={
        <RoleBasedRoute allowedRoles={["VENDOR", "vendor"]}>
          <VendorVerification />
        </RoleBasedRoute>
      } />

          <Route path="/profile" element={<Profile />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/provider/register" element={<ProviderRegistration />} />
          <Route path="/escrow-demo" element={<EscrowIntegration />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </div>
  </ProviderProfileProvider>
</ThemeProvider>
  );
};

export default App;
