import React, { useState } from 'react';
import { useFormik } from 'formik'; 
import * as Yup from 'yup'; 
import ConfirmationModal from './ConfirmationModal'; 
import styles from './SendMoney.module.css'; 




const SendMoneySchema = Yup.object().shape({
  recipientNumber: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
   
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
});



function SendMoney() {



  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [valuesToConfirm, setValuesToConfirm] = useState(null);



  const formik = useFormik({
    initialValues: {
      recipientNumber: '',
      amount: '',
    },

    validationSchema: SendMoneySchema, 
    onSubmit: (values, { setSubmitting, resetForm }) => {
      setMessage(''); 
      setError('');
      setSubmitting(true);
      setValuesToConfirm(values);

      setShowModal(true);

      
    },
  });


  // Function called when user confirms in the modal
  const handleConfirmSend = async () => {
    setShowModal(false);

    if (!valuesToConfirm) {
        setError('Confirmation values are missing.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('jwtToken');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`http://localhost:5001/api/wallet/${userId}/send/${valuesToConfirm.recipientNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(valuesToConfirm.amount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send money');
      }

      const data = await response.json();
      setMessage(data.message);
      setError('');

      formik.resetForm();
      setValuesToConfirm(null);

    } catch (err) {
      console.error('Send money error:', err);
      setError(err.message || 'An error occurred during transaction.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Function called when user cancels in the modal
  const handleCancelSend = () => {
    setShowModal(false); // Hide the modal
    // Optionally, clear valuesToConfirm or leave them
    // setValuesToConfirm(null); // Clearing means if they re-open the modal without resubmitting, it won't confirm the old values. This is safer.
    setValuesToConfirm(null);
    // Form values remain unchanged in Formik state, allowing the user to easily edit.
  };


//looks like a html : its JSX XML 
// className used instead of class


//ROKII STOPPED HERE HKML FHM BOOKRAA
  return (
    <div className={styles.pageContainer}>
      {/* Wrap the form content in the styled box */}
      <div className={styles.formBox}>
        <h2>Send Money</h2>

        {/* Display success or error messages */}
        {message && <div className={`${styles.message} ${styles.success}`}>{message}</div>}
        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}

        {/* Use Formik's handleSubmit for the form */}
        <form onSubmit={formik.handleSubmit}>
          <div>
            <label htmlFor="recipientNumber" className={styles.formLabel}>Recipient Username</label>
            <input
              type="text"
              id="recipientNumber"
              className={styles.formControl}
              name="recipientNumber"
              value={formik.values.recipientNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={loading || formik.isSubmitting}
              placeholder="Enter recipient's username"
            />
            {/* Display validation errors only if the field has been touched and has an error */}
            {formik.touched.recipientNumber && formik.errors.recipientNumber ? (
              <div className={`${styles.message} ${styles.error}`}>{formik.errors.recipientNumber}</div>
            ) : null}
          </div>

          <div>
            <label htmlFor="amount" className={styles.formLabel}>Amount</label>
            <input
              type="number"
              id="amount"
              className={styles.formControl}
              name="amount"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              step="0.01"
              min="0"
              disabled={loading || formik.isSubmitting}
            />
             {/* Display validation errors */}
            {formik.touched.amount && formik.errors.amount ? (
              <div className={`${styles.message} ${styles.error}`}>{formik.errors.amount}</div>
            ) : null}
          </div>

          {/* The button triggers Formik's onSubmit */}
          <button
            type="submit"
            className={styles.sendButton}
            // Disable button while async loading OR Formik is processing (validating/calling onSubmit)
            disabled={loading || formik.isSubmitting}
          >
            {loading || formik.isSubmitting ? 'Processing...' : 'Send Money'}
          </button>
        </form>
      </div>

      {/* Confirmation Modal - pass the confirmed values and handlers */}
      <ConfirmationModal
        show={showModal}
        // Pass values that were stored when the form was valid and submitted
        recipientNumber={valuesToConfirm?.recipientNumber}
        amount={valuesToConfirm?.amount}
        onConfirm={handleConfirmSend}
        onCancel={handleCancelSend}
      />
      
    </div>
  );
}

export default SendMoney;