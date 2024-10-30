import { useState } from 'react'

import { useRouter } from 'next/router'

import axios from 'axios'
import ButtonLoading from 'components/ButtonLoading'
import InputField from 'components/Panel/UI/InputField'
import { toast, Toaster } from 'react-hot-toast'

function Feedback({ t, onClose }) {
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' })
  const [isError, setIsError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const router = useRouter()
  const isStartPage = router.asPath === '/'

  const handleChange = (e) => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!feedback.name || !feedback.email || !feedback.message) {
      toast.error(t('NotAllFieldFull'))
      setIsError(true)
      return
    }

    setIsSaving(true)
    axios
      .post('/.netlify/functions/sendFeedback', JSON.stringify(feedback))
      .then(() => {
        toast.success(t('YourMessageHasBeenSent'))
        setIsError(false)
        setIsSent(true)
      })
      .catch((err) => {
        console.log({ err })
        toast.error(t('users:ErrorSending'))
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  return (
    <div className="flex w-full flex-col gap-6 md:gap-0">
      {isStartPage ? (
        <p className="font-semibold md:font-bold">{t('ConnectWithUs')}</p>
      ) : (
        !isSent && (
          <p
            className={`mb-4 font-semibold uppercase md:font-bold ${
              isStartPage ? '' : 'text-th-primary-100'
            }`}
          >
            {t('ConnectWithUs')}
          </p>
        )
      )}
      <div className="flex flex-grow items-center" onClick={(e) => e.stopPropagation()}>
        <Toaster />
        {!isSent ? (
          <form className="flex w-full flex-col space-y-4" onSubmit={handleSubmit}>
            <InputField
              name="name"
              type="text"
              id="floating_name"
              label={t('users:YourName')}
              value={feedback.name}
              isError={isError && !feedback.name}
              onChange={handleChange}
            />

            <InputField
              name="email"
              type="email"
              id="floating_email"
              label={t('users:Email')}
              value={feedback.email}
              isError={isError && !feedback.email}
              onChange={handleChange}
            />

            <InputField
              rows="3"
              name="message"
              type="textarea"
              id="floating_message"
              label={t('users:Message')}
              value={feedback.message}
              isError={isError && !feedback.message}
              onChange={handleChange}
              className="mb-3 max-h-40 overflow-auto"
            />

            <ButtonLoading
              type="submit"
              isLoading={isSaving}
              className={`relative rounded-lg px-5 py-4 text-center text-sm font-medium text-th-text-secondary-100 md:text-base ${
                isStartPage ? 'bg-slate-550' : 'bg-th-primary-100'
              }`}
            >
              {t('users:Send')}
            </ButtonLoading>
            <p className="text-center text-sm font-light">
              {t('users:ConditionOfConsent')}
            </p>
          </form>
        ) : (
          <div className="w-full text-center">
            <p>{t('users:YourMessageSentThankYou')}</p>
            <button
              className={`mt-14 rounded-lg px-10 py-4 text-center text-sm font-medium text-th-text-secondary-100 md:text-base ${
                isStartPage ? 'bg-slate-550' : 'bg-th-primary-100'
              }`}
              onClick={() => onClose()}
            >
              {t('common:Close')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Feedback
