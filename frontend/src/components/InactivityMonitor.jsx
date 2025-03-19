import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InactivityMonitor = () => {
    const navigate = useNavigate();

    useEffect(() => {
        let timeout;

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log("🔴 Usuário inativo, deslogando...");
                localStorage.removeItem("token");
                navigate("/"); // Redireciona para o login
            }, 15 * 60 * 1000); // 15 minutos de inatividade
        };

        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("click", resetTimer);
        resetTimer(); // Inicia o temporizador

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("keydown", resetTimer);
            window.removeEventListener("click", resetTimer);
        };
    }, [navigate]);

    return null;
};

export default InactivityMonitor;