
document.addEventListener('DOMContentLoaded', function () {
    const PRODUCT = {
        name: 'Premium Web Template Kit',
        price: 299,
        currency: 'PHP',
        description: 'A comprehensive collection of professionally designed web templates'
    };


    const buyNowBtn = document.getElementById('buyNowBtn');
    const paymentModal = document.getElementById('paymentModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const paymentForm = document.getElementById('paymentForm');
    const paymentStatus = document.getElementById('paymentStatus');

    // Event listeners
    buyNowBtn.addEventListener('click', openPaymentModal);
    closeModalBtn.addEventListener('click', closePaymentModal);
    paymentForm.addEventListener('submit', handlePaymentSubmission);

    function openPaymentModal() {
        paymentModal.style.display = 'flex';
        paymentStatus.style.display = 'none';
        paymentForm.style.display = 'block';
        paymentForm.reset();
    }

    function closePaymentModal() {
        paymentModal.style.display = 'none';
    }

    async function handlePaymentSubmission(e) {
        e.preventDefault();
        
        // Show loading state
        const submitButton = paymentForm.querySelector('.payment-submit');
        const originalButtonText = submitButton.textContent;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
        submitButton.disabled = true;
        
        try {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // Convert amount to centavos (e.g., ₱299 = 29900)
            const amountInCentavos = PRODUCT.price * 100;
            
            showPaymentStatus('processing', 'Connecting to GCash...');
            
            // Create a source using PayMongo API
            const response = await fetch("https://api.paymongo.com/v1/sources", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic " + btoa("sk_test_kggVXSBDUTfRAvTGvyReUEEr:")
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            amount: amountInCentavos,
                            redirect: {
                                success: window.location.origin + "/success.html",
                                failed: window.location.origin + "/failed.html"
                            },
                            billing: {
                                name: name,  // ✅ Include this
                                email: email,
                                phone: phone
                            },
                            type: "gcash",
                            currency: PRODUCT.currency
                        }
                    }
                })
            });

            const result = await response.json();
            
            if (result.errors) {
                // Handle API errors
                console.error('PayMongo API Error:', result.errors);
                showPaymentStatus('error', `Payment failed: ${result.errors[0].detail}`);
            } else if (result.data && result.data.attributes && result.data.attributes.redirect) {
                // Get checkout URL from response
                const checkoutUrl = result.data.attributes.redirect.checkout_url;
                
                showPaymentStatus('success', 'Redirecting to GCash...');
                
                // Redirect to GCash checkout page
                setTimeout(() => {
                    window.location.href = checkoutUrl;
                }, 1500);
            } else {
                console.error('Unexpected API response:', result);
                showPaymentStatus('error', 'Unexpected response from payment provider.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showPaymentStatus('error', 'Failed to connect to payment provider.');
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    function showPaymentStatus(type, message) {
        paymentStatus.className = `payment-status payment-${type}`;
        paymentStatus.textContent = message;
        paymentStatus.style.display = 'block';
    }
});

