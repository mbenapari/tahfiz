import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7fffc] text-slate-900 py-12">
      <div className="mx-auto max-w-[900px] px-6">
        <h1 className="text-3xl font-extrabold mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#6d8781] mb-6">Effective Date: 25 April 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            This Privacy Policy explains how Tahfiz (“we”, “our”, “us") collects, uses,
            discloses, and protects personal information when you use our Quran
            Memorization School Management System ("Platform"). The Platform is designed
            to support Quran schools, administrators, teachers, students, and guardians in
            managing memorization progress, attendance, communication, and related activities.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <h3 className="font-semibold">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-3">
            <li>Full name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Role (Admin, Teacher, Student, Guardian)</li>
            <li>School affiliation</li>
            <li>Profile information (e.g., gender, class level)</li>
          </ul>

          <h3 className="font-semibold">2.2 Student Data</h3>
          <ul className="list-disc pl-6 mb-3">
            <li>Memorization progress (Surahs, Juz, Ayahs)</li>
            <li>Assessment records</li>
            <li>Attendance records</li>
            <li>Performance notes from teachers</li>
          </ul>

          <h3 className="font-semibold">2.3 Technical Data</h3>
          <p className="mb-3">IP address, device/browser type, login timestamps, usage activity logs.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
          <p>We use collected data to:</p>
          <ul className="list-disc pl-6">
            <li>Provide and operate the Platform</li>
            <li>Manage school accounts (multi-tenant setup)</li>
            <li>Track Quran memorization progress</li>
            <li>Enable communication between teachers and guardians</li>
            <li>Improve system performance and user experience</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Data Sharing and Disclosure</h2>
          <p>We do <strong>not sell personal data</strong>. We may share data with:</p>
          <ul className="list-disc pl-6">
            <li>Authorized school administrators (within the same tenant)</li>
            <li>Service providers (hosting, SMS, payment providers)</li>
            <li>When required by law or regulatory authorities</li>
            <li>To protect rights, safety, and system integrity</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Data Isolation (Multi-Tenant Architecture)</h2>
          <p>
            Each school's data is logically isolated. Users can only access data belonging
            to their registered school.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Data Retention</h2>
          <p>
            We retain data as long as the school account is active, as required for legal
            or audit purposes, or until deletion is requested (subject to limitations).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Data Security</h2>
          <p>
            We implement encryption (in transit and at rest where applicable), access
            controls, and role-based permissions. However, no system is completely secure
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">8. Children’s Privacy</h2>
          <p>
            The Platform may process data of minors (students). This is done under the
            authority of schools and guardians. Schools are responsible for obtaining
            necessary parental consent where required.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">9. User Rights</h2>
          <p>Depending on applicable laws, users may request:</p>
          <ul className="list-disc pl-6">
            <li>Access to their data</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion (subject to system/legal constraints)</li>
            <li>Objection to certain processing activities</li>
          </ul>
          <p className="mt-3">Requests can be made via: <a href="mailto:hamdu@sinapari.com" className="text-[#0f766e]">hamdu@sinapari.com</a></p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">10. Cookies and Tracking</h2>
          <p>We may use cookies or similar technologies for authentication, session management, and analytics.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">11. Third-Party Services</h2>
          <p>We may integrate with payment providers, SMS gateways, and hosting infrastructure. These providers have their own privacy policies.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">12. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. Updates will be communicated via the Platform.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">13. Contact Information</h2>
          <p>
            For questions or requests:
            <br />
            Email: <a href="mailto:hamdu@sinapari.com" className="text-[#0f766e]">hamdu@sinapari.com</a>
          </p>
        </section>

        <div className="mt-8">
          <Link to="/landing" className="text-[#0f766e] font-semibold">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
