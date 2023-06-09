import { useEffect } from "react"

export default function game() {

	const handleMovement = () => {
		alert("aa")
	}

	useEffect(() => {
		document.addEventListener("keydown", handleMovement)
	}, [])

	return (
		<>nig</>
	)
}
