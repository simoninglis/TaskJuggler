# frozen_string_literal: true

require "json"
require "sinatra/base"
require "tempfile"
require "fileutils"
require "open3"
require "shellwords"

class RunnerApp < Sinatra::Base
  set :bind, "0.0.0.0"
  set :port, ENV.fetch("RUNNER_PORT", 4567).to_i
  set :protection, false  # Disable all Rack::Protection middleware

  # Path to tj3 executable (use bin/tj3 directly since RUBYLIB is configured)
  TJ3_BIN = File.expand_path("../bin/tj3", __dir__)

  # Helper method to extract correlation ID from request headers
  def correlation_id
    request.env['HTTP_X_CORRELATION_ID'] || 'unknown'
  end

  post "/execute" do
    content_type :json
    payload = JSON.parse(request.body.read)
    tjp_text = payload.fetch("tjp", "")

    cid = correlation_id
    puts "[#{cid}] Runner: Executing tj3 for project"

    # Create temporary directory for execution
    Dir.mktmpdir("tj3_run_") do |tmpdir|
      tjp_file = File.join(tmpdir, "project.tjp")
      # TaskJuggler adds .json extension, so use base name without extension
      json_basename = "project_data"
      json_output = File.join(tmpdir, "#{json_basename}.json")

      # Ensure TJP includes jsonreport directive
      tjp_with_json = ensure_json_report(tjp_text, json_basename)

      puts "[#{cid}] Runner: TJP content length: #{tjp_with_json.length} bytes"

      # Write TJP file
      File.write(tjp_file, tjp_with_json)

      # Execute TaskJuggler
      stdout, stderr, status = execute_tj3(tjp_file, tmpdir, cid)

      if status.success?
        # Read generated JSON if it exists
        if File.exist?(json_output)
          json_data = JSON.parse(File.read(json_output))
          puts "[#{cid}] Runner: TJ3 completed successfully"
          result = {
            status: "success",
            data: json_data,
            stdout: stdout,
            stderr: stderr
          }
        else
          # Debug: list files in tmpdir
          files_in_dir = Dir.glob(File.join(tmpdir, "*")).map { |f| File.basename(f) }
          puts "[#{cid}] Runner: TJ3 executed but no JSON output generated"
          result = {
            status: "error",
            message: "TaskJuggler executed but no JSON output generated",
            expected_file: json_output,
            files_found: files_in_dir,
            stdout: stdout,
            stderr: stderr
          }
        end
      else
        puts "[#{cid}] Runner: TJ3 execution failed (exit code: #{status.exitstatus})"
        result = {
          status: "error",
          message: "TaskJuggler execution failed",
          exit_code: status.exitstatus,
          stdout: stdout,
          stderr: stderr
        }
      end

      JSON.generate(result)
    end
  rescue StandardError => e
    content_type :json
    JSON.generate(
      status: "error",
      message: e.message,
      backtrace: e.backtrace.first(10)
    )
  end

  post "/validate" do
    content_type :json
    payload = JSON.parse(request.body.read)
    tjp_text = payload.fetch("tjp", "")

    cid = correlation_id
    puts "[#{cid}] Runner: Validating TJP content (#{tjp_text.length} bytes)"

    # Create temporary file for validation
    Dir.mktmpdir("tj3_validate_") do |tmpdir|
      tjp_file = File.join(tmpdir, "project.tjp")

      # Write TJP file
      File.write(tjp_file, tjp_text)

      # Execute tj3 --check for validation only
      stdout, stderr, status = validate_tj3(tjp_file, tmpdir, cid)

      if status.success?
        puts "[#{cid}] Runner: Validation passed"
        result = {
          valid: true,
          message: "Valid TaskJuggler syntax",
          errorOutput: nil
        }
      else
        puts "[#{cid}] Runner: Validation failed"
        result = {
          valid: false,
          message: "TJP syntax validation failed",
          errorOutput: stderr.strip
        }
      end

      JSON.generate(result)
    end
  rescue StandardError => e
    content_type :json
    JSON.generate(
      valid: false,
      message: "Validation error: #{e.message}",
      errorOutput: e.backtrace.first(10).join("\n")
    )
  end

  get "/health" do
    content_type :json
    JSON.generate(status: "ok")
  end

  private

  # Ensure TJP includes jsonreport directive for JSON output
  def ensure_json_report(tjp_text, basename)
    # Check if tjp_text already has jsonreport
    return tjp_text if tjp_text.include?("jsonreport")

    # Append jsonreport directive (TaskJuggler will add .json extension)
    tjp_text + <<~JSONREPORT

      # Auto-generated JSON report
      jsonreport json_export "#{basename}" {
        formats json
      }
    JSONREPORT
  end

  # Execute tj3 --check for validation only
  def validate_tj3(tjp_file, work_dir, cid = 'unknown')
    puts "[#{cid}] Runner: Running tj3 --check"

    # Run tj3 in check mode (syntax validation only, no execution)
    command = "export RUBYLIB=/app/lib && cd #{Shellwords.escape(work_dir)} && ruby #{Shellwords.escape(TJ3_BIN)} --check #{Shellwords.escape(File.basename(tjp_file))}"

    stdout_str, stderr_str, status = Open3.capture3(
      "/bin/bash", "-c", command
    )

    [stdout_str, stderr_str, status]
  end

  # Execute tj3 and capture output
  def execute_tj3(tjp_file, work_dir, cid = 'unknown')
    puts "[#{cid}] Runner: About to execute tj3"
    puts "[#{cid}] Runner: File path: #{tjp_file}"
    puts "[#{cid}] Runner: Work dir: #{work_dir}"

    # Since TaskJuggler gems are now in runner Gemfile, we can run directly
    command = "export RUBYLIB=/app/lib && cd #{Shellwords.escape(work_dir)} && ruby #{Shellwords.escape(TJ3_BIN)} #{Shellwords.escape(File.basename(tjp_file))}"

    stdout_str, stderr_str, status = Open3.capture3(
      "/bin/bash", "-c", command
    )

    [stdout_str, stderr_str, status]
  end

  # Start the server when run directly
  run! if app_file == $0
end
