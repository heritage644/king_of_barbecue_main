'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeSearchForm } from '@/components/store/HomeSearchForm';

// Animation variants for orchestration
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const imageContainerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function HeroBanner() {
  return (
    <section className="container-padded space-y-5 pt-4 pb-8">
      {/* Mobile / tablet search */}
      <HomeSearchForm />

      {/* Hero banner */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative overflow-hidden rounded-2xl bg-[#151515] text-white shadow-md sm:rounded-[2rem]"
      >
        <div className="flex min-h-[160px] items-stretch justify-between sm:min-h-[220px] lg:min-h-[260px]">
          {/* Left Content Area */}
          <div className="flex flex-1 flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12">
            <motion.h1
              variants={itemVariants}
              className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Good food.
              <br />
              <span className="text-primary">Hot</span> off the{' '}
              <span className="text-primary">grill</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-2 max-w-sm text-xs text-gray-300 sm:mt-3 sm:text-sm lg:text-base"
            >
              Grilled favourites, BBQ classics and sides made fresh to order.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-4 sm:mt-6">
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-primary px-5 py-2 text-xs font-semibold hover:bg-ember-700 sm:px-6 sm:text-sm"
              >
                <Link href="/menu" className="inline-flex items-center gap-1.5">
                  Order now{' '}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 sm:h-4 sm:w-4"
                    aria-hidden
                  />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Right Image Container */}
          <motion.div
            variants={imageContainerVariants}
            className="group relative w-[35%] shrink-0 overflow-hidden sm:w-[30%] lg:w-[28%]"
          >
            <Image
              src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80"
              alt="Barbecue ribs fresh off the grill"
              fill
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 30vw, 35vw"
              className="object-cover object-right transition-transform duration-700 ease-out group-hover:scale-105"
              priority
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}