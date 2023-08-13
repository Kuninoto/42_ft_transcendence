'use client'

import { api, multipartApi } from '@/api/api'
import { useEffect, useState} from 'react'
import { toast } from 'react-toastify'
import OtpInput from "react18-input-otp";
import { removeParams, useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useForm } from 'react-hook-form'

function QRCode({
	closeModal,
}: {
	closeModal: () => void
}) {
	const [otp, setOtp] = useState('');
	const [QRCodeEncode, setQRCodeEncode] = useState("")

	const { user, refreshUser } = useAuth()

	const enable2fa = () => {
		try {
			api.patch("/auth/2fa/enable", {
				twoFactorAuthCode: otp
			})
			.then(() => {
				setOtp('')
				refreshUser()
			})
			.catch(() => {throw "Network error"})

		} catch (error) {
			toast.error(error)
		}
	}

	const disable2fa = () => {
		try {
			api.patch("/auth/2fa/disable")
			.then(() => {
				refreshUser()
			})
			.catch(() => {throw "Network error"})

		} catch (error) {
			toast.error(error)
		}
	}

	useEffect(() => {
		try {
			api.post("/auth/2fa/generate")
			.then((result) => setQRCodeEncode(result.data))
			.catch(() => {throw "Network error"})

		} catch (error) {
			toast.error(error)
			
		}
	}, [])

	if (user?.has_2fa) {
		return(
			<div className="flex flex-col place-conten-center items-center">
				
				<button
					onClick={disable2fa}
					className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black" >
					Disable
				</button>

			</div>
		)
	}

	return (
		<div className="flex flex-col space-y-4 h-full items-center">

			<div className="relative w-48 aspect-square">
				<Image
					alt={'choose new image - image'}
					className="h-max w-max"
					fill
					loader={removeParams}
					objectFit="cover"
					sizes="100vw"
					src={QRCodeEncode || '/placeholder.gif'}
				/>
			</div>

			<OtpInput
				value={otp}
				onChange={(newOtp) => setOtp(newOtp)}
				numInputs={6}
				onSubmit={console.log(otp)}
				containerStyle="w-full place-content-center flex text-xl space-x-1"
				inputStyle="border bg-transparent !w-8 aspect-square rounded"
				isInputNum
			/>


			<button 
				onClick={enable2fa}
				className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black" >
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

	const { handleSubmit, register , setError, formState: {errors}} = useForm<FormData>({
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
		} catch (error) {
			setError('name', { type: 'Conflict', message: error.response.data.message})
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
					<div className="relative items-center space-x-16 h-full flex rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-12 py-8 leading-none">

						<form
							className="flex flex-col space-y-2 w-64"
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
											className="h-max w-max"
											fill
											loader={removeParams}
											objectFit="cover"
											sizes="100vw"
											src={user?.avatar_url || '/placeholder.gif'}
										/>
									</div>
								</label>
							</fieldset>

							<fieldset className="flex items-center w-full">
								<label htmlFor="name">Name:</label>
								<input
									id="name"
									{...register('name', { 
										minLength: { value: 4, message: "Usernames length must at least 4 characters long"}, 
										maxLength: { value: 10, message: "Usernames length must have up to 10 characters long "},
										pattern: { value: /^[A-Za-z0-9_-]+$/, message: "Invalid character"}})}
									className="rounded border border-white bg-transparent px-2 py-2 w-full outline-none"
									type="text"
								/>
							</fieldset>

							{ errors.name && <span className="text-[0.5rem] text-end text-red-600">{errors.name.message}</span> }

							<input 
								className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
								type="submit" 
								value="Submit" />
						</form>

						<div className="h-full bg-white w-px"></div>

						<div className="flex flex-col space-y-8">
							<h2>2FA Authentication</h2>
							<QRCode />
						</div>

					</div>
				</div>
			</div>
		</div>
	)
}
