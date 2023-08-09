
import { api, multipartApi } from "@/api/api"
import { removeParams, useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"
import Image from 'next/image'

export default function SettingsModal ({ closeModal }: { closeModal: () => void }) {
	
	const { user, refreshUser } = useAuth()

	const { register, handleSubmit, getValues} = useForm<FormData>( {
		defaultValues: {
			name: user.name
		}
	})

	async function onSubmit({ name, photos }: { name: string, photos: File[]}) {

			try {
				if (name.length !== 0 && name !== user.name)
				{
					await api.patch("/me/username", {
						newUsername: name
					})
				}

				if (photos.length !== 0)
				{
					await multipartApi.patch("/me/avatar", {
						avatar: photos[0]
					})
				}

				refreshUser()
				closeModal()
			} catch (error) {

				console.log(error)
			}
	}


  	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32 ">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">

						<form className="flex flex-col space-y-2" onSubmit={handleSubmit(onSubmit)}>

							<fieldset className="border-2 border-white h-full aspect-square rounded">
								<label>
									<input {...register("photos")} type="file" className="text-sm cursor-pointer w-36 hidden" accept="image/*"/>
									<div className="relative h-full w-full">
										<div className="bg-black/60 cursor-pointer z-10 absolute w-full h-full flex place-content-center items-center">
											Click me
										</div>
										<Image
											loader={removeParams}
											alt={'choose new image - image'}
											fill
											sizes="100vw"
											className="h-max w-max"
											layout="fill"
											objectFit="cover"
											src={user?.avatar_url || '/placeholder.jpg'}
										/>
									</div>

								</label>
							</fieldset>

							<fieldset className="flex items-center">
								<label htmlFor="name">Name:</label>
								<input id="name" {...register("name", { maxLength: 10 })} className="bg-transparent border border-white outline-none rounded py-2 px-2" type="text" />
							</fieldset>

							<input type="submit" value="Submit" />
						</form>

					</div>
				</div>
			</div>
		</div>
  )
}
