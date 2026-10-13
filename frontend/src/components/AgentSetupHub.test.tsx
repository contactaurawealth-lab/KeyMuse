import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentSetupHub } from './AgentSetupHub';

describe('AgentSetupHub Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it('renders hero header, protocol badge, and target OS buttons', () => {
    render(<AgentSetupHub />);
    expect(screen.getByText('Connect Your AI Coding Agent')).toBeDefined();
    expect(screen.getByText('MCP 2.x PROTOCOL')).toBeDefined();
    expect(screen.getByText('LINUX')).toBeDefined();
    expect(screen.getByText('MACOS')).toBeDefined();
    expect(screen.getByText('WINDOWS')).toBeDefined();
  });

  it('switches between coding agents and renders matching configuration snippets', () => {
    render(<AgentSetupHub />);

    // Default Antigravity
    expect(screen.getByText('4. MCP Configuration for ANTIGRAVITY')).toBeDefined();

    // Click Claude Code
    const claudeBtn = screen.getByRole('button', { name: /Claude Code/i });
    fireEvent.click(claudeBtn);
    expect(screen.getByText('4. MCP Configuration for CLAUDE')).toBeDefined();
    expect(screen.getByText(/claude mcp add keymuse/i)).toBeDefined();

    // Click Cursor IDE
    const cursorBtn = screen.getByRole('button', { name: /Cursor IDE/i });
    fireEvent.click(cursorBtn);
    expect(screen.getByText('4. MCP Configuration for CURSOR')).toBeDefined();

    // Click VSCode / Cline
    const clineBtn = screen.getByRole('button', { name: /VSCode \/ Cline/i });
    fireEvent.click(clineBtn);
    expect(screen.getByText('4. MCP Configuration for CLINE')).toBeDefined();
  });

  it('filters available MCP tools using the search bar', () => {
    render(<AgentSetupHub />);

    // Verify tools are rendered
    expect(screen.getByText('keymuse_validate_brief')).toBeDefined();
    expect(screen.getByText('keymuse_create_chord_progression')).toBeDefined();
    expect(screen.getByText('keymuse_render_preview')).toBeDefined();

    // Search for "chord"
    const searchInput = screen.getByPlaceholderText('Filter tools...');
    fireEvent.change(searchInput, { target: { value: 'chord' } });

    expect(screen.getByText('keymuse_create_chord_progression')).toBeDefined();
    expect(screen.queryByText('keymuse_validate_brief')).toBeNull();
  });

  it('expands and collapses troubleshooting FAQ accordion questions', () => {
    render(<AgentSetupHub />);

    const faqButton = screen.getByText(/ModuleNotFoundError: No module named keymuse/i);
    expect(screen.queryByText(/Ensure KeyMuse was installed into your agent/i)).toBeNull();

    // Click to expand
    fireEvent.click(faqButton);
    expect(screen.getByText(/Ensure KeyMuse was installed into your agent/i)).toBeDefined();

    // Click to collapse
    fireEvent.click(faqButton);
    expect(screen.queryByText(/Ensure KeyMuse was installed into your agent/i)).toBeNull();
  });

  it('persists connection checklist state to localStorage upon checkbox toggle', () => {
    render(<AgentSetupHub />);

    const firstCheckbox = screen.getByLabelText(/1\. Cloned Git repository/i) as HTMLInputElement;
    expect(firstCheckbox.checked).toBe(false);

    // Toggle on
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(true);
    expect(localStorage.getItem('keymuse_agent_checklist')).toContain('"step_git":true');

    // Toggle off
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(false);
    expect(localStorage.getItem('keymuse_agent_checklist')).toContain('"step_git":false');
  });

  it('copies code snippets to clipboard when copy button is clicked', async () => {
    render(<AgentSetupHub />);

    const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
