import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-white/10 rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-xl">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-white/80 text-sm font-medium">{label}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
      </div>
    </motion.div>
  );
}