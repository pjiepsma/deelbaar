'use client'
import { Link, NavGroup, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React from 'react'

export const ListingsImportExportLinks = () => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <NavGroup label="Data">
      <NavLink href={`${adminRoute}/listings/import`} label="Importeren" />
      <NavLink href={`${adminRoute}/listings/export`} label="Exporteren" />
    </NavGroup>
  )
}

const NavLink = (props: { href: string; label: string }) => {
  const pathname = usePathname()

  const isActive = pathname === props.href

  const Label = (
    <>
      {isActive && <div className={'nav__link-indicator'} />}
      <span className="nav__link-label">{props.label}</span>
    </>
  )

  return (
    <Link className={'nav__link'} href={props.href}>
      {Label}
    </Link>
  )
}
