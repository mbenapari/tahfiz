import React from "react";
import { Link } from "react-router-dom";

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7fffc] text-slate-900 py-12">
      <div className="mx-auto max-w-[900px] px-6">
        <h1 className="text-3xl font-extrabold mb-4">Terms of Service</h1>
        <p className="text-sm text-[#6d8781] mb-6">Effective Date: 25 April 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using the Platform, you agree to these Terms of Service (“Terms”). If you do not agree, you must not use the Platform.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
          <p>The Platform provides tools for:</p>
          <ul className="list-disc pl-6">
            <li>Quran memorization tracking</li>
            <li>Student and teacher management</li>
            <li>Attendance and assessments</li>
            <li>Communication between schools and guardians</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. User Roles and Responsibilities</h2>
          <h3 className="font-semibold">3.1 Schools (Administrators)</h3>
          <ul className="list-disc pl-6 mb-3">
            <li>Responsible for managing their accounts and users</li>
            <li>Must ensure accuracy of data entered</li>
            <li>Must obtain consent for student data where required</li>
          </ul>

          <h3 className="font-semibold">3.2 Teachers</h3>
          <ul className="list-disc pl-6 mb-3">
            <li>Responsible for accurate recording of student progress</li>
            <li>Must maintain confidentiality of student information</li>
          </ul>

          <h3 className="font-semibold">3.3 Students and Guardians</h3>
          <ul className="list-disc pl-6">
            <li>Must provide accurate information</li>
            <li>Must not misuse the Platform</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Account Registration</h2>
          <ul className="list-disc pl-6">
            <li>Users must provide accurate and complete information</li>
            <li>Accounts must not be shared</li>
            <li>Users are responsible for maintaining login credentials</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Multi-Tenant Usage</h2>
          <p>Each school operates as an independent tenant. Users may only access data within their assigned school.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6">
            <li>Use the Platform for unlawful purposes</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Interfere with system operations</li>
            <li>Upload harmful or malicious content</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Payments (If Applicable)</h2>
          <ul className="list-disc pl-6">
            <li>Certain features may require payment</li>
            <li>Fees are non-refundable unless stated otherwise</li>
            <li>Payment providers may be third-party services</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">8. Data Ownership</h2>
          <p>Schools retain ownership of their data. We retain rights to operate, store, and process data to provide services.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">9. Service Availability</h2>
          <p>We aim for high availability but do not guarantee uninterrupted service. We may perform maintenance, update features, or modify/discontinue parts of the service.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">10. Termination</h2>
          <p>We may suspend or terminate accounts if Terms are violated or fraudulent/abusive behavior is detected. Users may also request account deletion.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">11. Limitation of Liability</h2>
          <p>To the extent permitted by law, we are not liable for indirect or consequential damages and we do not guarantee accuracy of user-generated data.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">12. Indemnification</h2>
          <p>Users agree to indemnify and hold harmless the Platform from claims arising from misuse or violation of these Terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">13. Governing Law</h2>
          <p>These Terms shall be governed by the laws of [Insert Country, e.g., Ghana].</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">14. Changes to Terms</h2>
          <p>We may update these Terms. Continued use of the Platform constitutes acceptance of updated Terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">15. Contact Information</h2>
          <p>
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

export default Terms;
