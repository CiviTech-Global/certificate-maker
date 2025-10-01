import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentsView } from './components/StudentsView';
import { CertificatesView } from './components/CertificatesView';
import { VerificationView } from './components/VerificationView';
import { TemplatesView } from './components/TemplatesView';
import { StudentForm } from './components/StudentForm';
import { BulkUpload } from './components/BulkUpload';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onCreateStudent={() => setShowStudentForm(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
            onViewStudents={() => setActiveTab('students')}
            onViewCertificates={() => setActiveTab('certificates')}
          />
        );
      case 'students':
        return (
          <StudentsView
            onCreateStudent={() => setShowStudentForm(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
          />
        );
      case 'certificates':
        return <CertificatesView />;
      case 'templates':
        return <TemplatesView />;
      case 'verify':
        return <VerificationView />;
      default:
        return <Dashboard
          onCreateStudent={() => setShowStudentForm(true)}
          onBulkUpload={() => setShowBulkUpload(true)}
          onViewStudents={() => setActiveTab('students')}
          onViewCertificates={() => setActiveTab('certificates')}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        {renderActiveComponent()}
      </Layout>

      {/* Modals */}
      {showStudentForm && (
        <StudentForm
          onClose={() => setShowStudentForm(false)}
          onSuccess={() => {
            // Force re-render of current component
            window.location.reload();
          }}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            // Force re-render of current component
            window.location.reload();
          }}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
