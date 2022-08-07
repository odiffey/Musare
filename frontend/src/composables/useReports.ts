import Toast from "toasters";
import ws from "@/ws";

export const useReports = () => {
	const resolveReport = ({ reportId, value }) =>
		new Promise((resolve, reject) => {
			ws.socket.dispatch("reports.resolve", reportId, value, res => {
				new Toast(res.message);
				if (res.status === "success")
					return resolve({ status: "success" });
				return reject(new Error(res.message));
			});
		});

	const removeReport = reportId =>
		new Promise((resolve, reject) => {
			ws.socket.dispatch("reports.remove", reportId, res => {
				new Toast(res.message);
				if (res.status === "success")
					return resolve({ status: "success" });
				return reject(new Error(res.message));
			});
		});

	return {
		resolveReport,
		removeReport
	};
};
