import React, { useState, useEffect } from 'react';
import { Users, Award, GraduationCap, TrendingUp, Plus, Upload, FileText } from 'lucide-react';
import { apiService } from '../services/api';
import type { Student, CertificateWithDetails } from '../types';
import toast from 'react-hot-toast';

interface DashboardProps {
  onCreateStudent: () => void;
  onBulkUpload: () => void;
  onViewStudents: () => void;
  onViewCertificates: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateStudent,
  onBulkUpload,
  onViewStudents,
  onViewCertificates
}) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    totalCourses: 0,
    recentCertificates: 0
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentCertificates, setRecentCertificates] = useState<CertificateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load students
      const studentsResponse = await apiService.getAllStudents();
      const students = studentsResponse.data || [];

      // Load certificates
      const certificatesResponse = await apiService.getAllCertificates();
      const certificates = certificatesResponse.data || [];

      // Load courses
      const coursesResponse = await apiService.getAllCourses();
      const courses = coursesResponse.data || [];

      // Calculate stats
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentCertificatesCount = certificates.filter(cert =>
        new Date(cert.certificate.createdAt) >= thirtyDaysAgo
      ).length;

      setStats({
        totalStudents: students.length,
        totalCertificates: certificates.length,
        totalCourses: courses.length,
        recentCertificates: recentCertificatesCount
      });

      // Set recent data (last 5 items)
      setRecentStudents(students.slice(0, 5));
      setRecentCertificates(certificates.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color }: {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    color: string;
  }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105 text-left w-full"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Certificate Maker</h1>
        <p className="text-green-100 text-lg">
          Generate professional certificates for your students with ease
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Certificates"
          value={stats.totalCertificates}
          icon={Award}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={GraduationCap}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Recent Certificates"
          value={stats.recentCertificates}
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend="Last 30 days"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Add Student"
            description="Register a new student"
            icon={Plus}
            onClick={onCreateStudent}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <QuickActionCard
            title="Bulk Upload"
            description="Upload students from CSV"
            icon={Upload}
            onClick={onBulkUpload}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <QuickActionCard
            title="View Students"
            description="Manage all students"
            icon={Users}
            onClick={onViewStudents}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <QuickActionCard
            title="View Certificates"
            description="Manage certificates"
            icon={FileText}
            onClick={onViewCertificates}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
          </div>
          <div className="p-6">
            {recentStudents.length > 0 ? (
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No students registered yet</p>
            )}
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Certificates</h3>
          </div>
          <div className="p-6">
            {recentCertificates.length > 0 ? (
              <div className="space-y-4">
                {recentCertificates.map((cert) => (
                  <div key={cert.certificate.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cert.student.firstName} {cert.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{cert.course.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No certificates generated yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};