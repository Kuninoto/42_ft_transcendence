export default function FriendsModal ({ closeModal } : { closeModal: () => void}) {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen place-content-center items-center reltaive flex">
      <button onClick={closeModal} className="absolute top-0 left-0 w-screen h-screen bg-black/30"></button>
      <div className="px-8 py-32">
        <div className="grid relative group gap-8 items-start justify-center">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative px-7 py-4 bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% rounded-lg leading-none flex items-center divide-x divide-gray-600">

              <input type="text" />
              
            </div>
          </div>
      </div>

    </div>
  )
}