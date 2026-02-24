import { useState, useEffect } from "react";
import axios from "../../api/axios.tsx";
import { 
  FaQuestionCircle, FaEnvelope, FaFlag, FaBug, FaLightbulb, 
  FaBook, FaShieldAlt, FaChevronDown, FaChevronUp, FaCheck,
  FaExclamationTriangle, FaComments, FaUserShield, FaClock,
  FaTimes, FaSearch, FaPaperPlane
} from "react-icons/fa";
import "./Support.css";

const Support = () => {
  const [activeSection, setActiveSection] = useState("help");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ subject: "", category: "general", message: "", email: "" });
  const [bugReport, setBugReport] = useState({ title: "", description: "", steps: "", severity: "low" });
  const [featureRequest, setFeatureRequest] = useState({ title: "", description: "", useCase: "" });
  const [myReports, setMyReports] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = Number(localStorage.getItem('userId'));
  const userEmail = localStorage.getItem('email') || '';

  useEffect(() => {
    if (userEmail) {
      setContactForm(prev => ({ ...prev, email: userEmail }));
    }
    fetchMyReports();
  }, [userEmail]);

  const fetchMyReports = async () => {
    try {
      const response = await axios.get(`/api/reports/user/${userId}`);
      setMyReports(response.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const faqs = [
    {
      category: "Account",
      questions: [
        { q: "How do I change my password?", a: "Go to Settings > Security > Change Password. You'll need to enter your current password and then your new password twice to confirm." },
        { q: "How do I update my profile picture?", a: "Click on your profile, then click the camera icon on your profile picture. You can upload a new image from your device." },
        { q: "How do I delete my account?", a: "Go to Settings > Account > Delete Account. Please note this action is permanent and cannot be undone." },
        { q: "Can I change my username?", a: "Yes! Go to Settings > Profile > Edit Username. Usernames must be unique and between 3-20 characters." }
      ]
    },
    {
      category: "Privacy & Safety",
      questions: [
        { q: "How do I block someone?", a: "Visit their profile and click the three dots menu, then select 'Block User'. They won't be able to see your posts or contact you." },
        { q: "How do I report inappropriate content?", a: "Click the three dots on any post and select 'Report'. Choose the reason and our moderation team will review it within 24 hours." },
        { q: "Who can see my posts?", a: "By default, your posts are visible to everyone. You can change this in Settings > Privacy > Post Visibility." },
        { q: "How is my data protected?", a: "We use industry-standard encryption and never sell your personal data. Read our Privacy Policy for complete details." }
      ]
    },
    {
      category: "Features",
      questions: [
        { q: "How do Stories work?", a: "Stories are temporary posts that disappear after 24 hours. Click the '+' button in the Stories section to create one." },
        { q: "How do I create a poll?", a: "When creating a post, click the Poll icon. Add your question and options, then post!" },
        { q: "What are hashtags for?", a: "Hashtags help categorize your posts and make them discoverable. Use #topic to tag your posts." },
        { q: "How do I save posts?", a: "Click the bookmark icon on any post to save it. Access saved posts from your profile or the Saved section." }
      ]
    },
    {
      category: "Troubleshooting",
      questions: [
        { q: "Why can't I post?", a: "Check your internet connection. If the issue persists, try logging out and back in, or clear your browser cache." },
        { q: "Images not loading?", a: "This is usually a network issue. Try refreshing the page or checking your connection speed." },
        { q: "Notifications not working?", a: "Ensure notifications are enabled in your browser settings and in Aurora Settings > Notifications." },
        { q: "App running slow?", a: "Try clearing your browser cache, closing other tabs, or using a different browser." }
      ]
    }
  ];

  const guidelines = [
    { icon: <FaUserShield />, title: "Respect Others", desc: "Treat everyone with respect. Harassment, hate speech, and bullying are not tolerated." },
    { icon: <FaShieldAlt />, title: "Keep It Safe", desc: "Don't share personal information like addresses, phone numbers, or financial details." },
    { icon: <FaExclamationTriangle />, title: "No Harmful Content", desc: "Content promoting violence, self-harm, or illegal activities will be removed." },
    { icon: <FaCheck />, title: "Be Authentic", desc: "Use your real identity. Impersonation and fake accounts are prohibited." },
    { icon: <FaComments />, title: "Constructive Discourse", desc: "Disagree respectfully. Personal attacks and trolling harm our community." },
    { icon: <FaBook />, title: "Intellectual Property", desc: "Only share content you own or have permission to use. Credit original creators." }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reports', {
        userId,
        type: 'contact',
        category: contactForm.category,
        subject: contactForm.subject,
        message: contactForm.message,
        email: contactForm.email
      });
      setSubmitSuccess("contact");
      setContactForm({ subject: "", category: "general", message: "", email: userEmail });
      setTimeout(() => setSubmitSuccess(null), 3000);
      fetchMyReports();
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reports', {
        userId,
        type: 'bug',
        title: bugReport.title,
        description: bugReport.description,
        steps: bugReport.steps,
        severity: bugReport.severity
      });
      setSubmitSuccess("bug");
      setBugReport({ title: "", description: "", steps: "", severity: "low" });
      setTimeout(() => setSubmitSuccess(null), 3000);
      fetchMyReports();
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reports', {
        userId,
        type: 'feature',
        title: featureRequest.title,
        description: featureRequest.description,
        useCase: featureRequest.useCase
      });
      setSubmitSuccess("feature");
      setFeatureRequest({ title: "", description: "", useCase: "" });
      setTimeout(() => setSubmitSuccess(null), 3000);
      fetchMyReports();
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = searchQuery.trim() 
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#8b5cf6';
    }
  };

  const sections = [
    { key: "help", label: "Help Center", icon: <FaQuestionCircle /> },
    { key: "contact", label: "Contact Us", icon: <FaEnvelope /> },
    { key: "guidelines", label: "Guidelines", icon: <FaShieldAlt /> },
    { key: "bug", label: "Report Bug", icon: <FaBug /> },
    { key: "feature", label: "Suggest Feature", icon: <FaLightbulb /> },
    { key: "reports", label: "My Reports", icon: <FaFlag /> }
  ];

  return (
    <div className="support-container">
      {/* Aurora Background Effect */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-1"></div>
        <div className="aurora-layer aurora-2"></div>
        <div className="aurora-layer aurora-3"></div>
      </div>

      <div className="support-content">
        {/* Header */}
        <div className="support-header">
          <h1 className="support-title">
            <span className="aurora-text">Support Center</span>
          </h1>
          <p className="support-subtitle">How can we help you today?</p>
        </div>

        {/* Navigation Tabs */}
        <div className="support-tabs">
          {sections.map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`support-tab ${activeSection === section.key ? 'active' : ''}`}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="support-section-content">
          
          {/* Help Center / FAQs */}
          {activeSection === "help" && (
            <div className="help-section">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="clear-search">
                    <FaTimes />
                  </button>
                )}
              </div>

              {filteredFaqs.map((category, catIdx) => (
                <div key={catIdx} className="faq-category">
                  <h3 className="faq-category-title">{category.category}</h3>
                  <div className="faq-list">
                    {category.questions.map((faq, idx) => {
                      const faqKey = `${catIdx}-${idx}`;
                      const isExpanded = expandedFaq === faqKey;
                      return (
                        <div 
                          key={idx} 
                          className={`faq-item ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => setExpandedFaq(isExpanded ? null : faqKey)}
                        >
                          <div className="faq-question">
                            <span>{faq.q}</span>
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                          {isExpanded && (
                            <div className="faq-answer">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact Form */}
          {activeSection === "contact" && (
            <div className="contact-section">
              <div className="section-header">
                <FaEnvelope className="section-icon" />
                <div>
                  <h2>Contact Our Team</h2>
                  <p>We typically respond within 24-48 hours. You can also email us directly at <a href="mailto:amirbendaniels@gmail.com" style={{ color: '#6366f1' }}>amirbendaniels@gmail.com</a></p>
                </div>
              </div>

              {submitSuccess === "contact" && (
                <div className="success-message">
                  <FaCheck /> Your message has been sent! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="support-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={contactForm.category}
                      onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="account">Account Issue</option>
                      <option value="technical">Technical Problem</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press/Media</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    required
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                    rows={6}
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  <FaPaperPlane /> {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          )}

          {/* Community Guidelines */}
          {activeSection === "guidelines" && (
            <div className="guidelines-section">
              <div className="section-header">
                <FaShieldAlt className="section-icon" />
                <div>
                  <h2>Community Guidelines</h2>
                  <p>Our rules for a safe and welcoming community</p>
                </div>
              </div>

              <div className="guidelines-grid">
                {guidelines.map((guideline, idx) => (
                  <div key={idx} className="guideline-card">
                    <div className="guideline-icon">{guideline.icon}</div>
                    <h3>{guideline.title}</h3>
                    <p>{guideline.desc}</p>
                  </div>
                ))}
              </div>

              <div className="guidelines-footer">
                <p>
                  Violations of these guidelines may result in content removal, temporary suspension, 
                  or permanent ban depending on severity. We review all reports carefully and fairly.
                </p>
              </div>
            </div>
          )}

          {/* Bug Report */}
          {activeSection === "bug" && (
            <div className="bug-section">
              <div className="section-header">
                <FaBug className="section-icon bug" />
                <div>
                  <h2>Report a Bug</h2>
                  <p>Help us improve by reporting issues you encounter</p>
                </div>
              </div>

              {submitSuccess === "bug" && (
                <div className="success-message">
                  <FaCheck /> Bug report submitted! Thank you for helping us improve.
                </div>
              )}

              <form onSubmit={handleBugSubmit} className="support-form">
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label>Bug Title</label>
                    <input
                      type="text"
                      value={bugReport.title}
                      onChange={(e) => setBugReport({...bugReport, title: e.target.value})}
                      required
                      placeholder="Brief description of the bug"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Severity</label>
                    <select
                      value={bugReport.severity}
                      onChange={(e) => setBugReport({...bugReport, severity: e.target.value})}
                    >
                      <option value="low">Low - Minor issue</option>
                      <option value="medium">Medium - Affects usability</option>
                      <option value="high">High - Major problem</option>
                      <option value="critical">Critical - App unusable</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={bugReport.description}
                    onChange={(e) => setBugReport({...bugReport, description: e.target.value})}
                    required
                    rows={4}
                    placeholder="What went wrong? What did you expect to happen?"
                  />
                </div>

                <div className="form-group">
                  <label>Steps to Reproduce</label>
                  <textarea
                    value={bugReport.steps}
                    onChange={(e) => setBugReport({...bugReport, steps: e.target.value})}
                    rows={4}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  />
                </div>

                <button type="submit" className="submit-btn bug-btn" disabled={loading}>
                  <FaBug /> {loading ? 'Submitting...' : 'Submit Bug Report'}
                </button>
              </form>
            </div>
          )}

          {/* Feature Request */}
          {activeSection === "feature" && (
            <div className="feature-section">
              <div className="section-header">
                <FaLightbulb className="section-icon feature" />
                <div>
                  <h2>Suggest a Feature</h2>
                  <p>Share your ideas to make Aurora even better</p>
                </div>
              </div>

              {submitSuccess === "feature" && (
                <div className="success-message">
                  <FaCheck /> Thank you for your suggestion! We love hearing from our community.
                </div>
              )}

              <form onSubmit={handleFeatureSubmit} className="support-form">
                <div className="form-group">
                  <label>Feature Title</label>
                  <input
                    type="text"
                    value={featureRequest.title}
                    onChange={(e) => setFeatureRequest({...featureRequest, title: e.target.value})}
                    required
                    placeholder="Name your feature idea"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={featureRequest.description}
                    onChange={(e) => setFeatureRequest({...featureRequest, description: e.target.value})}
                    required
                    rows={4}
                    placeholder="Describe the feature in detail..."
                  />
                </div>

                <div className="form-group">
                  <label>Use Case</label>
                  <textarea
                    value={featureRequest.useCase}
                    onChange={(e) => setFeatureRequest({...featureRequest, useCase: e.target.value})}
                    rows={3}
                    placeholder="How would this feature help you or others?"
                  />
                </div>

                <button type="submit" className="submit-btn feature-btn" disabled={loading}>
                  <FaLightbulb /> {loading ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </form>
            </div>
          )}

          {/* My Reports */}
          {activeSection === "reports" && (
            <div className="reports-section">
              <div className="section-header">
                <FaFlag className="section-icon" />
                <div>
                  <h2>My Reports & Submissions</h2>
                  <p>Track the status of your reports and requests</p>
                </div>
              </div>

              {myReports.length === 0 ? (
                <div className="empty-state">
                  <FaClock style={{ fontSize: '3rem', color: '#64748b', marginBottom: '1rem' }} />
                  <h3>No submissions yet</h3>
                  <p>Your bug reports, feature requests, and contact messages will appear here.</p>
                </div>
              ) : (
                <div className="reports-list">
                  {myReports.map((report, idx) => (
                    <div key={idx} className="report-item">
                      <div className="report-header">
                        <div className="report-type">
                          {report.type === 'bug' && <FaBug />}
                          {report.type === 'feature' && <FaLightbulb />}
                          {report.type === 'contact' && <FaEnvelope />}
                          {report.type === 'post' && <FaFlag />}
                          <span>{report.type?.charAt(0).toUpperCase() + report.type?.slice(1)}</span>
                        </div>
                        <span 
                          className="report-status"
                          style={{ background: getStatusColor(report.status) + '20', color: getStatusColor(report.status) }}
                        >
                          {report.status || 'Pending'}
                        </span>
                      </div>
                      <h4>{report.title || report.subject || 'Report'}</h4>
                      <p>{report.description || report.message}</p>
                      <span className="report-date">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
