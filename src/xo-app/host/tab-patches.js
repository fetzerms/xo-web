import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createDoesHostNeedRestart } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { restartHost } from 'xo'

const MISSING_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: patch => patch.name,
    sortCriteria: patch => patch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => (
      <a href={patch.documentationUrl} target='_blank'>
        {patch.description}
      </a>
    ),
    sortCriteria: patch => patch.description
  },
  {
    name: _('patchReleaseDate'),
    itemRenderer: patch => <span><FormattedTime value={patch.date} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={patch.date} />)</span>,
    sortCriteria: patch => patch.date,
    sortOrder: 'desc'
  },
  {
    name: _('patchGuidance'),
    itemRenderer: patch => patch.guidance,
    sortCriteria: patch => patch.guidance
  },
  {
    name: _('patchAction'),
    itemRenderer: (patch, installPatch) => (
      <ActionRowButton
        btnStyle='primary'
        handler={installPatch}
        handlerParam={patch}
        icon='host-patch-update'
      />
    )
  }
]

const INSTALLED_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: patch => patch.poolPatch.name,
    sortCriteria: patch => patch.poolPatch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => patch.poolPatch.description,
    sortCriteria: patch => patch.poolPatch.description
  },
  {
    default: true,
    name: _('patchApplied'),
    itemRenderer: patch => {
      const time = patch.time * 1000
      return (
        <span>
          <FormattedTime value={time} day='numeric' month='long' year='numeric' />
          {' '}
          (<FormattedRelative value={time} />)
        </span>
      )
    },
    sortCriteria: patch => patch.time,
    sortOrder: 'desc'
  },
  {
    name: _('patchSize'),
    itemRenderer: patch => formatSize(patch.poolPatch.size),
    sortCriteria: patch => patch.poolPatch.size
  }
]

@connectStore(() => ({
  needsRestart: createDoesHostNeedRestart((_, props) => props.host)
}))
export default class HostPatches extends Component {
  render () {
    const { host, hostPatches, missingPatches, installAllPatches, installPatch } = this.props
    return process.env.XOA_PLAN > 1
      ? <Container>
        <Row>
          <Col className='text-xs-right'>
            {(this.props.needsRestart && isEmpty(missingPatches)) && <TabButton
              btnStyle='warning'
              handler={restartHost}
              handlerParam={host}
              icon='host-reboot'
              labelId='rebootUpdateHostLabel'
            />}
            {isEmpty(missingPatches)
              ? <TabButton
                disabled
                handler={installAllPatches}
                icon='success'
                labelId='hostUpToDate'
              />
              : <TabButton
                btnStyle='primary'
                handler={installAllPatches}
                icon='host-patch-update'
                labelId='patchUpdateButton'
              />
            }
          </Col>
        </Row>
        {!isEmpty(missingPatches) && <Row>
          <Col>
            <h3>{_('hostMissingPatches')}</h3>
            <SortedTable collection={missingPatches} userData={installPatch} columns={MISSING_PATCH_COLUMNS} />
          </Col>
        </Row>}
        <Row>
          <Col>
            {!isEmpty(hostPatches)
              ? (
              <span>
                <h3>{_('hostAppliedPatches')}</h3>
                <SortedTable collection={hostPatches} columns={INSTALLED_PATCH_COLUMNS} />
              </span>
              ) : <h4 className='text-xs-center'>{_('patchNothing')}</h4>
            }
          </Col>
        </Row>
      </Container>
      : <Container><Upgrade place='hostPatches' available={2} /></Container>
  }
}
