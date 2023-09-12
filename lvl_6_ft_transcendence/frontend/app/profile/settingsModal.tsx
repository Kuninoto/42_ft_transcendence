'use client'

import { api, multipartApi } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import Tippy from '@tippyjs/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AiOutlineQuestionCircle } from 'react-icons/ai'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import OtpInput from 'react18-input-otp'

function Tooltip() {
	return (
		<div className="flex flex-col divide-y divide-white rounded border border-white bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-2 ">
			<span className="py-2">
				<b>Step 1</b>: Install Google Authenticator
			</span>
			<span className="py-2">
				<b>Step 2</b>: Scan the QRCode to register the app
			</span>
			<span className="py-2">
				<b>Step 3</b>: Type down the OTP on your phone&apos;s screen and press
				&quot;enable&quot;
			</span>
		</div>
	)
}

function QRCode() {
	const [otp, setOtp] = useState('')
	const [QRCodeEncode, setQRCodeEncode] = useState('')

	const { logout, user } = useAuth()

	const enable2fa = () => {
		api
			.patch('/auth/2fa/enable', {
				otp,
			})
			.then(() => {
				setOtp('')
				toast("Redirecting to login...")
				setTimeout(() => {
					logout()
				}, 3 * 1000)
			})
			.catch((error: Error | AxiosError) => {
				toast.error(error.response.data.message || error.message)
			})
	}

	const disable2fa = () => {
		try {
			api
				.patch('/auth/2fa/disable')
				.then(() => {
					logout()
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	useEffect(() => {
		try {
			api
				.post('/auth/2fa/generate')
				.then((result) => setQRCodeEncode(result.data))
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}, [])

	if (user?.has_2fa) {
		return (
			<div className="place-conten-center flex flex-col items-center">
				<button
					className="w-full rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
					onClick={disable2fa}
				>
					Disable
				</button>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col items-center space-y-4">
			<div className="relative aspect-square w-48">
				<Image
					alt={'choose new image - image'}
					className="object-cover"
					fill
					loader={removeParams}
					sizes="100%"
					src={QRCodeEncode || '/placeholder.gif'}
				/>
			</div>

			<OtpInput
				containerStyle="w-full place-content-center flex text-xl space-x-1"
				inputStyle="border bg-transparent !w-8 aspect-square rounded"
				isInputNum
				numInputs={6}
				onChange={(newOtp: string) => setOtp(newOtp)}
				value={otp}
			/>

			<button
				className="w-full rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
				onClick={enable2fa}
			>
				Enable
			</button>
		</div>
	)
}

export default function SettingsModal({
	closeModal,
}: {
	closeModal: () => void
}) {
	const { refreshUser, user } = useAuth()

	const {
		formState: { errors },
		handleSubmit,
		register,
		setError,
	} = useForm<FormData>({
		defaultValues: {
			name: user.name,
		},
	})

	async function onSubmit({ name, photos }: { name: string; photos: File[] }) {
		try {
			if (name !== user.name) {
				await api.patch('/me/username', {
					newUsername: name,
				})
			}

			if (photos.length !== 0) {
				await multipartApi.patch('/me/avatar', {
					avatar: photos[0],
				})
			}

			refreshUser()
			closeModal()
		} catch (error: any) {
			setError('name', {
				message: error.response.data.message,
				type: 'Conflict',
			})
		}
	}

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative flex h-full items-center space-x-16 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-12 py-8 leading-none">
						<form
							className="flex w-64 flex-col space-y-2"
							onSubmit={handleSubmit(onSubmit)}
						>
							<fieldset className="aspect-square h-full rounded border-2 border-white">
								<label>
									<input
										{...register('photos')}
										accept="image/*"
										className="hidden w-36 cursor-pointer text-sm"
										type="file"
									/>
									<div className="relative h-full w-full">
										<div className="absolute z-10 flex h-full w-full cursor-pointer place-content-center items-center bg-black/60">
											Click me
										</div>
										<Image
											alt={'choose new image - image'}
											className="h-max w-max object-cover"
											fill
											loader={removeParams}
											sizes="100%"
											src={user?.avatar_url || '/placeholder.gif'}
										/>
									</div>
								</label>
							</fieldset>

							<fieldset className="flex w-full items-center">
								<label htmlFor="name">Name:</label>
								<input
									id="name"
									{...register('name', {
										maxLength: {
											message:
												'Usernames length must have up to 10 characters long ',
											value: 10,
										},
										minLength: {
											message:
												'Usernames length must at least 4 characters long',
											value: 4,
										},
										pattern: {
											message: 'Invalid character',
											value: /^[A-Za-z0-9_-]+$/,
										},
									})}
									className="w-full rounded border border-white bg-transparent px-2 py-2 outline-none"
									type="text"
								/>
							</fieldset>

							{errors.name && (
								<span className="text-end text-[0.5rem] text-red-600">
									{errors.name.message}
								</span>
							)}

							<input
								className="w-full rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
								type="submit"
								value="Submit"
							/>
						</form>

						<div className="h-full w-px bg-white"></div>

						<div className="flex flex-col space-y-8">
							<h2 className="flex items-center space-x-2">
								<span>2FA Authentication</span>
								<Tippy content={<Tooltip />} placement={'right'}>
									<button>
										<AiOutlineQuestionCircle size={24} />
									</button>
								</Tippy>
							</h2>
							<QRCode />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
