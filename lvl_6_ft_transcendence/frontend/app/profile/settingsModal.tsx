
import { api, multipartApi } from "@/api/api"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"

export default function SettingsModal ({ closeModal }: { closeModal: () => void }) {
	
	const { user, refreshUser } = useAuth()

	const { register, handleSubmit } = useForm<FormData>( {
		defaultValues: {
			name: user.name
		}
	})

	async function onSubmit({ name, photo }: any) {

		if (name.length != 0)
		{
			await api.patch("/me/username", {
				newUsername: name
			})
		}

		if(photo.length != 0)
		{
			await multipartApi.patch("/me/avatar", {
					avatar: photo[0]
			})
		}

		api.get("/me").then((result) => {
			refreshUser(result.data)
			closeModal()
		})
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
							<fieldset className="flex items-center">
								<label htmlFor="name">Name:</label>
								<input id="name" {...register("name", { maxLength: 10 })} className="bg-transparent border border-white outline-none rounded py-2 px-2" type="text" />
							</fieldset>
							<input {...register("photo")} type="file" accept="image/*"/>
							<input type="submit" value="Submit" />
						</form>

					</div>
				</div>
			</div>
		</div>
  )
}
