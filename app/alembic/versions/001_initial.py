"""initial

Revision ID: 001
Revises: 
Create Date: 2024-01-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create forms table
    op.create_table('forms',
        sa.Column('uuid', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('fields', postgresql.JSON(), nullable=False),
        sa.Column('password', sa.String(), nullable=True),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'))
    )

    # Create responses table
    op.create_table('responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('form_uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('response_data', postgresql.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['form_uuid'], ['forms.uuid'], ondelete='CASCADE'),
    )

    # Create indexes
    op.create_index('idx_forms_uuid', 'forms', ['uuid'])
    op.create_index('idx_responses_form_uuid', 'responses', ['form_uuid'])

def downgrade() -> None:
    op.drop_index('idx_responses_form_uuid')
    op.drop_index('idx_forms_uuid')
    op.drop_table('responses')
    op.drop_table('forms') 