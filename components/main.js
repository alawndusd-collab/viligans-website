// Main JavaScript for Viligans Command Corporation Website
// NEMT Services for Veterans and Rural Wyoming Residents

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (header) {
            if (scrollTop > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
            } else {
                header.style.background = '#ffffff';
                header.style.backdropFilter = 'none';
            }
        }
        
        lastScrollTop = scrollTop;
    });

    // Form handling
    const scheduleForm = document.querySelector('.schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.service-card, .highlight, .coverage-zone, .contact-card').forEach(el => {
        observer.observe(el);
    });

    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
            }
            e.target.value = value;
        });
    });

    // Date input minimum date (today)
    const dateInput = document.querySelector('#appointment-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Service type change handler
    const serviceTypeSelect = document.querySelector('#service-type');
    const specialNeedsTextarea = document.querySelector('#special-needs');
    
    if (serviceTypeSelect && specialNeedsTextarea) {
        serviceTypeSelect.addEventListener('change', function() {
            const serviceType = this.value;
            let placeholder = 'Wheelchair access, medical equipment, etc.';
            
            switch(serviceType) {
                case 'dialysis':
                    placeholder = 'Wheelchair access, dialysis chair preference, medical equipment, etc.';
                    break;
                case 'physical-therapy':
                    placeholder = 'Mobility aids, wheelchair access, walker assistance, etc.';
                    break;
                case 'hospital-discharge':
                    placeholder = 'Wheelchair, medical equipment transport, family member accompaniment, etc.';
                    break;
                case 'specialty-care':
                    placeholder = 'Long-distance comfort needs, medical equipment, wheelchair access, etc.';
                    break;
            }
            
            specialNeedsTextarea.setAttribute('placeholder', placeholder);
        });
    }

    // Veteran status handler
    const veteranStatusRadios = document.querySelectorAll('input[name="veteran-status"]');
    const militaryBranchGroup = document.querySelector('[data-military-branch-group]');
    
    if (veteranStatusRadios.length > 0) {
        veteranStatusRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (militaryBranchGroup) {
                    if (this.value === 'yes') {
                        militaryBranchGroup.style.display = 'block';
                        militaryBranchGroup.querySelector('select').setAttribute('required', 'required');
                    } else {
                        militaryBranchGroup.style.display = 'none';
                        militaryBranchGroup.querySelector('select').removeAttribute('required');
                    }
                }
            });
        });
    }

    // Emergency contact click tracking
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('emergency_contact_clicked', { phone: this.href });
        });
    });

    // Auto-populate form from URL parameters (for referrals)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('service')) {
        const serviceSelect = document.querySelector('#service-type');
        if (serviceSelect) {
            serviceSelect.value = urlParams.get('service');
        }
    }
    
    if (urlParams.has('referral')) {
        const referralField = document.querySelector('#referral-source');
        if (referralField) {
            referralField.value = urlParams.get('referral');
        }
    }
});

// Track user events for analytics
function trackEvent(eventName, eventData = {}) {
    console.log(`Event: ${eventName}`, eventData);
    
    // Send to analytics endpoint if available
    if (window.gtag) {
        gtag('event', eventName, eventData);
    }
}

// Form submission handler
async function handleFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate required fields
    const requiredFields = ['patient-name', 'phone', 'pickup-address', 'destination', 'appointment-date', 'appointment-time', 'service-type'];
    const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
    
    if (missingFields.length > 0) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate phone number
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
        showNotification('Please enter a valid phone number in format (307) 123-4567', 'error');
        return;
    }
    
    // Validate appointment date (not in the past)
    const appointmentDate = new Date(data['appointment-date']);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
        showNotification('Appointment date cannot be in the past.', 'error');
        return;
    }
    
    // Validate Medicaid/Insurance eligibility if required
    if (!validateInsuranceEligibility(data)) {
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Scheduling...';
    submitButton.disabled = true;
    
    try {
        // Submit form to backend API
        const response = await submitFormToAPI(data);
        
        if (response.ok) {
            const result = await response.json();
            
            // Show success message
            showNotification('Transportation scheduled successfully! We will contact you within 2 hours to confirm details.', 'success');
            
            // Track successful booking
            trackEvent('transportation_booked', {
                service_type: data['service-type'],
                veteran: data['veteran-status'] || 'not-specified'
            });
            
            // Send confirmation email
            await sendConfirmationEmail(data);
            
            // Reset form
            form.reset();
            
            // Redirect to confirmation page if URL is provided
            if (result.confirmation_url) {
                setTimeout(() => {
                    window.location.href = result.confirmation_url;
                }, 2000);
            }
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to schedule transportation. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification('An error occurred while scheduling. Please try again or call us directly.', 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Validate insurance/Medicaid eligibility
function validateInsuranceEligibility(data) {
    const insurance = data.insurance || '';
    
    // If insurance is required and not provided
    if (!insurance || insurance.trim() === '') {
        showNotification('Please specify your insurance provider. Viligans specializes in Medicaid-funded transportation.', 'warning');
        return false;
    }
    
    // Add validation rules specific to your coverage
    const acceptedProviders = ['medicaid', 'medicare', 'tricare', 'va', 'private'];
    const insuranceNormalized = insurance.toLowerCase();
    
    if (!acceptedProviders.some(provider => insuranceNormalized.includes(provider))) {
        showNotification('We specialize in Medicaid and veteran benefit coverage. Please call us to verify coverage.', 'warning');
    }
    
    return true;
}

// Submit form data to backend API
async function submitFormToAPI(data) {
    // Prepare data for backend
    const requestData = {
        patient: {
            name: data['patient-name'],
            phone: data.phone,
            email: data.email || null,
            veteran_status: data['veteran-status'] || 'not-specified',
            military_branch: data['military-branch'] || null
        },
        transport: {
            pickup_address: data['pickup-address'],
            destination: data.destination,
            appointment_date: data['appointment-date'],
            appointment_time: data['appointment-time'],
            service_type: data['service-type'],
            special_needs: data['special-needs'] || null
        },
        insurance: {
            provider: data.insurance || null,
            policy_number: data['policy-number'] || null
        },
        referral_source: data['referral-source'] || null,
        submitted_at: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/transportation-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        return response;
    } catch (error) {
        console.error('API submission failed:', error);
        throw error;
    }
}

// Send confirmation email
async function sendConfirmationEmail(data) {
    const emailData = {
        recipient_email: data.email || 'aldavis@viliganscommandcorp.com',
        recipient_name: data['patient-name'],
        subject: 'Transportation Request Confirmation - Viligans Command Corporation',
        request_details: {
            patient_name: data['patient-name'],
            phone: data.phone,
            pickup_address: data['pickup-address'],
            destination: data.destination,
            appointment_date: data['appointment-date'],
            appointment_time: data['appointment-time'],
            service_type: data['service-type'],
            special_needs: data['special-needs'] || 'None specified',
            insurance: data.insurance || 'Not specified',
            veteran_status: data['veteran-status'] || 'Not specified',
            military_branch: data['military-branch'] || 'N/A'
        },
        send_to_admin: true,
        admin_email: 'aldavis@viliganscommandcorp.com'
    };
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
            console.log('Confirmation email sent successfully');
            trackEvent('confirmation_email_sent', { 
                patient_name: data['patient-name'] 
            });
        } else {
            console.warn('Failed to send confirmation email');
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't show error to user - booking is already confirmed
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${escapeHtml(message)}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 16px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        default: return '#0ea5e9';
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    // Close mobile menu with Escape key
    if (e.key === 'Escape') {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// Performance optimization - lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}