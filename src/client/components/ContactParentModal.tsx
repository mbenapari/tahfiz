import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface ContactParentModalProps {
  studentName: string;
  email?: string;
  phone?: string;
  onClose: () => void;
  onEdit: () => void;
}

export const ContactParentModal: React.FC<ContactParentModalProps> = ({ 
  studentName, 
  email, 
  phone, 
  onClose,
  onEdit
}) => {
  const hasContact = email || phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-green/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Mail size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Contact Information</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-text-muted text-sm mb-1">Student</p>
            <h3 className="text-white text-lg font-bold">{studentName}</h3>
          </div>

          {!hasContact ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="p-4 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                <AlertCircle size={32} />
              </div>
              <div>
                <p className="text-white font-bold">No Contact Information</p>
                <p className="text-text-muted text-sm mt-1 leading-relaxed">
                  We couldn't find any email or phone number for this student or their parent.
                </p>
              </div>
              <button 
                onClick={onEdit}
                className="mt-2 w-full bg-primary hover:bg-primary-hover text-background-dark py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
              >
                Add Contact Info
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {phone && (
                <div className="group bg-background-dark/50 border border-border-green/20 p-4 rounded-xl flex items-center justify-between hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Phone Number</p>
                      <p className="text-white font-medium">{phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${phone}`}
                      className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      title="Call"
                    >
                      <Phone size={18} />
                    </a>
                    <a 
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-text-muted hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-all"
                      title="WhatsApp"
                    >
                      <MessageSquare size={18} />
                    </a>
                  </div>
                </div>
              )}

              {email && (
                <div className="group bg-background-dark/50 border border-border-green/20 p-4 rounded-xl flex items-center justify-between hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</p>
                      <p className="text-white font-medium truncate max-w-[180px]">{email}</p>
                    </div>
                  </div>
                  <a 
                    href={`mailto:${email}`}
                    className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    title="Send Email"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasContact && (
          <div className="p-6 border-t border-border-green/20 flex justify-center bg-white/[0.02]">
            <button 
              onClick={onEdit}
              className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Update Information
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
