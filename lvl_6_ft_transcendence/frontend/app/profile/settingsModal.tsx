import { api, multipartApi } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useForm } from 'react-hook-form'

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
			console.log(error)
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
									{...register('name', { maxLength: { value: 10, message: "2 < name.length < 11"}, minLength: { value: 3, message: "2 < name.length < 11"}, pattern: { value: /^[A-Za-z0-9_]+$/, message: "Invalid character"}})}
									className="rounded border border-white bg-transparent px-2 py-2 w-full outline-none"
									type="text"
								/>
							</fieldset>

							{ errors.name && <span className="text-[0.5rem] text-end text-red-600">{errors.name.message}</span> }
							{
								console.log(errors.name)
							}

							<input 
								className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
								type="submit" 
								value="Submit" />
						</form>

						<div className="h-full bg-white w-px"></div>

						<div className="flex flex-col place-content-between h-full items-center">

							<h2>2FA Authetication</h2>

							<div className="relative w-48 aspect-square">
								<Image
									alt={'choose new image - image'}
									className="h-max w-max"
									fill
									loader={removeParams}
									objectFit="cover"
									sizes="100vw"
									src={'/placeholder.gif'}
								/>
							</div>
							
							<button>asdoawnfiawj</button>
						</div>

					</div>
				</div>
			</div>
		</div>
	)
}
